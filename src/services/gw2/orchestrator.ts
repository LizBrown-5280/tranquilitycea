import {
  getActiveEndpointProfileKey,
  type Gw2EndpointProfileKey,
} from '@/services/gw2/endpointManifest'
import { OPTIONAL_ON_404_ENDPOINT_IDS } from '@/services/gw2/endpointSupportPolicy'
import { createGw2HttpClient } from '@/services/gw2/httpClient'
import { parseEndpointPayload } from '@/services/gw2/endpointParsers'
import type { HttpResponse } from '@/services/gw2/httpClient'
import type {
  Gw2EndpointErrorType,
  Gw2EndpointBatchResult,
  Gw2EndpointDefinition,
  Gw2EndpointRunResult,
} from '@/types/gw2'

interface ExecuteBatchOptions {
  apiKey?: string
  payloadByEndpoint?: Record<string, unknown[]>
  profileKey?: Gw2EndpointProfileKey
  label?: string
}

const DEFAULT_CSV_PARAM = 'ids'
const DEFAULT_PAGE_PARAM = 'page'
const DEFAULT_PAGE_SIZE_PARAM = 'page_size'
const DEFAULT_PAGE_SIZE = 50
const DEFAULT_CHUNK_SIZE = 50

function chunkValues<T>(values: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []

  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize))
  }

  return chunks
}

function interpolatePath(pathTemplate: string, id: string | number): string {
  return pathTemplate.replace('{id}', encodeURIComponent(String(id)))
}

function createEmptyResult(endpoint: Gw2EndpointDefinition): Gw2EndpointRunResult {
  return {
    endpointId: endpoint.id,
    section: endpoint.section,
    scope: endpoint.scope,
    mode: endpoint.mode,
    requiredScopes: endpoint.requiredScopes,
    ok: true,
    requestCount: 0,
    payload: [],
  }
}

function classifyHttpError(status: number, endpoint: Gw2EndpointDefinition): Gw2EndpointErrorType {
  if (status === 403 && endpoint.scope === 'account') {
    return 'missingScope'
  }

  if (status === 401 && endpoint.scope === 'account') {
    return 'invalidKey'
  }

  if (status >= 400) {
    return 'http'
  }

  if (status === 0) {
    return 'network'
  }

  return 'unknown'
}

async function executeEndpoint(
  endpoint: Gw2EndpointDefinition,
  requestJson: (
    path: string,
    options?: { query?: Record<string, string | number>; apiKey?: string },
  ) => Promise<HttpResponse<unknown>>,
  options: ExecuteBatchOptions,
): Promise<Gw2EndpointRunResult> {
  const result = createEmptyResult(endpoint)
  const errors: string[] = []
  const errorTypes = new Set<Gw2EndpointErrorType>()

  const request = async (path: string, query?: Record<string, string | number>) => {
    result.requestCount += 1

    const response = await requestJson(path, {
      apiKey: options.apiKey,
      query,
    })

    if (!response.ok) {
      if (response.status === 404 && OPTIONAL_ON_404_ENDPOINT_IDS.has(endpoint.id)) {
        return
      }

      errors.push(response.error ?? 'Unknown request error')
      errorTypes.add(classifyHttpError(response.status, endpoint))
      return
    }

    try {
      const parsedPayload = parseEndpointPayload(endpoint.id, response.data)
      result.payload.push(parsedPayload)
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Failed to parse endpoint payload')
      errorTypes.add('parser')
    }
  }

  if (endpoint.mode === 'single') {
    await request(endpoint.path)
  }

  if (endpoint.mode === 'csvIds') {
    const ids = endpoint.staticIds.map((value) => String(value))
    const csvParam = endpoint.csvParam ?? DEFAULT_CSV_PARAM
    const chunks = chunkValues(ids, endpoint.chunkSize ?? DEFAULT_CHUNK_SIZE)

    for (const chunk of chunks) {
      await request(endpoint.path, {
        [csvParam]: chunk.join(','),
      })
    }
  }

  if (endpoint.mode === 'csvFrom') {
    const dependencyPayload = options.payloadByEndpoint?.[endpoint.dependsOn] ?? []
    const ids = endpoint.extractIds(dependencyPayload).map((value) => String(value))
    const csvParam = endpoint.csvParam ?? DEFAULT_CSV_PARAM
    const chunks = chunkValues(ids, endpoint.chunkSize ?? DEFAULT_CHUNK_SIZE)

    for (const chunk of chunks) {
      await request(endpoint.path, {
        [csvParam]: chunk.join(','),
      })
    }
  }

  if (endpoint.mode === 'paged') {
    const pageParam = endpoint.pageParam ?? DEFAULT_PAGE_PARAM
    const pageSizeParam = endpoint.pageSizeParam ?? DEFAULT_PAGE_SIZE_PARAM
    const pageSize = endpoint.pageSize ?? DEFAULT_PAGE_SIZE
    const maxPages = endpoint.maxPages ?? 2

    for (let page = 0; page < maxPages; page += 1) {
      const response = await requestJson(endpoint.path, {
        apiKey: options.apiKey,
        query: {
          [pageParam]: page,
          [pageSizeParam]: pageSize,
        },
      })

      result.requestCount += 1

      if (!response.ok) {
        errors.push(response.error ?? `Failed to fetch page ${page}`)
        errorTypes.add(classifyHttpError(response.status, endpoint))
        break
      }

      try {
        const parsedPayload = parseEndpointPayload(endpoint.id, response.data)
        result.payload.push(parsedPayload)
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Failed to parse endpoint payload')
        errorTypes.add('parser')
        break
      }

      if (Array.isArray(response.data) && response.data.length < pageSize) {
        break
      }
    }
  }

  if (endpoint.mode === 'byId') {
    for (const id of endpoint.staticIds) {
      const targetPath = endpoint.idPathTemplate
        ? interpolatePath(endpoint.idPathTemplate, id)
        : `${endpoint.path}/${encodeURIComponent(String(id))}`

      await request(targetPath)
    }
  }

  if (endpoint.mode === 'expandFrom') {
    const dependencyPayload = options.payloadByEndpoint?.[endpoint.dependsOn] ?? []
    const ids = endpoint.extractIds(dependencyPayload)

    for (const id of ids) {
      const targetPath = interpolatePath(endpoint.idPathTemplate, id)
      await request(targetPath)
    }
  }

  if (errors.length > 0) {
    result.ok = false
    result.error = errors.join('; ')

    if (errorTypes.has('missingScope')) {
      result.errorType = 'missingScope'
    } else if (errorTypes.has('invalidKey')) {
      result.errorType = 'invalidKey'
    } else if (errorTypes.has('parser')) {
      result.errorType = 'parser'
    } else if (errorTypes.has('http')) {
      result.errorType = 'http'
    } else if (errorTypes.has('network')) {
      result.errorType = 'network'
    } else {
      result.errorType = 'unknown'
    }
  }

  return result
}

export async function executeEndpointBatch(
  endpoints: Gw2EndpointDefinition[],
  options: ExecuteBatchOptions = {},
): Promise<Gw2EndpointBatchResult> {
  const startedAt = Date.now()
  const client = createGw2HttpClient()
  const payloadByEndpoint: Record<string, unknown[]> = {
    ...(options.payloadByEndpoint ?? {}),
  }

  const results: Gw2EndpointRunResult[] = []

  for (const endpoint of endpoints) {
    const requestJson = (
      path: string,
      requestOptions?: { query?: Record<string, string | number>; apiKey?: string },
    ) => client.requestJson<unknown>(path, requestOptions)

    const result = await executeEndpoint(endpoint, requestJson, {
      apiKey: options.apiKey,
      payloadByEndpoint,
    })

    results.push(result)
    payloadByEndpoint[endpoint.id] = result.payload
  }

  if (import.meta.env.DEV) {
    const batchDurationMs = Date.now() - startedAt
    const totalRequests = results.reduce((sum, result) => sum + result.requestCount, 0)
    const failures = results.filter((result) => !result.ok)
    const profileKey = options.profileKey ?? getActiveEndpointProfileKey()
    const label = options.label ?? 'batch'

    console.groupCollapsed(
      `[GW2 API] ${label} | profile=${profileKey} | endpoints=${results.length} | requests=${totalRequests} | failures=${failures.length} | duration=${batchDurationMs}ms`,
    )
    console.table(
      results.map((result) => ({
        endpoint: result.endpointId,
        section: result.section,
        requests: result.requestCount,
        ok: result.ok,
        payloads: result.payload.length,
        errorType: result.errorType ?? '',
      })),
    )
    console.groupEnd()
  }

  return {
    results,
    payloadByEndpoint,
  }
}
