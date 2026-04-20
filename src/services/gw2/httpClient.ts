interface RetryPolicy {
  retries: number
  baseDelayMs: number
}

interface Gw2HttpClientOptions {
  baseUrl?: string
  timeoutMs?: number
  concurrency?: number
  retry?: RetryPolicy
  apiKey?: string
  authMode?: 'query' | 'header'
}

interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>
  apiKey?: string
}

export interface HttpResponse<T> {
  ok: boolean
  status: number
  data?: T
  error?: string
}

const DEFAULT_BASE_URL = 'https://api.guildwars2.com'
const DEFAULT_TIMEOUT_MS = 9000
const DEFAULT_CONCURRENCY = 4
const DEFAULT_RETRY: RetryPolicy = {
  retries: 2,
  baseDelayMs: 250,
}

class HttpStatusError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

class ConcurrencyQueue {
  private active = 0
  private readonly waiting: Array<() => void> = []

  constructor(private readonly limit: number) {}

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.active >= this.limit) {
      await new Promise<void>((resolve) => {
        this.waiting.push(resolve)
      })
    }

    this.active += 1

    try {
      return await task()
    } finally {
      this.active -= 1
      const next = this.waiting.shift()
      if (next) {
        next()
      }
    }
  }
}

function isTransientStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof HttpStatusError) {
    return isTransientStatus(error.status)
  }

  return error instanceof Error
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unknown request error'
}

function getBackoffDelay(attempt: number, baseDelayMs: number): number {
  return baseDelayMs * 2 ** attempt
}

export function createGw2HttpClient(options: Gw2HttpClientOptions = {}) {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const retry = options.retry ?? DEFAULT_RETRY
  const queue = new ConcurrencyQueue(options.concurrency ?? DEFAULT_CONCURRENCY)
  const authMode = options.authMode ?? 'query'

  async function requestJson<T>(
    path: string,
    requestOptions: RequestOptions = {},
  ): Promise<HttpResponse<T>> {
    return queue.run(async () => {
      for (let attempt = 0; attempt <= retry.retries; attempt += 1) {
        try {
          const url = new URL(path, baseUrl)

          if (requestOptions.query) {
            for (const [key, value] of Object.entries(requestOptions.query)) {
              if (value === undefined) {
                continue
              }
              url.searchParams.set(key, String(value))
            }
          }

          const controller = new AbortController()
          const timeoutId = globalThis.setTimeout(() => {
            controller.abort()
          }, timeoutMs)

          const headers = new Headers()
          headers.set('Accept', 'application/json')

          const effectiveKey = requestOptions.apiKey ?? options.apiKey
          if (effectiveKey) {
            if (authMode === 'header') {
              headers.set('Authorization', `Bearer ${effectiveKey}`)
            } else {
              url.searchParams.set('access_token', effectiveKey)
            }
          }

          const response = await fetch(url, {
            method: 'GET',
            headers,
            signal: controller.signal,
          })

          globalThis.clearTimeout(timeoutId)

          if (!response.ok) {
            throw new HttpStatusError(
              response.status,
              `Request failed with status ${response.status}`,
            )
          }

          const data = (await response.json()) as T
          return {
            ok: true,
            status: response.status,
            data,
          }
        } catch (error) {
          if (attempt === retry.retries || !isRetryableError(error)) {
            const status = error instanceof HttpStatusError ? error.status : 0
            return {
              ok: false,
              status,
              error: toErrorMessage(error),
            }
          }

          const delayMs = getBackoffDelay(attempt, retry.baseDelayMs)
          await new Promise<void>((resolve) => {
            globalThis.setTimeout(resolve, delayMs)
          })
        }
      }

      return {
        ok: false,
        status: 0,
        error: 'Retry loop terminated unexpectedly',
      }
    })
  }

  return {
    requestJson,
  }
}
