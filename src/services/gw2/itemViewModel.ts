import { sanitizeGw2Text } from '@/services/gw2/unlockCategoryViewModel'
import { flattenPayloadEntries } from '@/services/gw2/aggregators/helpers'
import type { Gw2EndpointRunResult } from '@/types/gw2'

export interface Gw2NormalizedItem {
  id: number
  name: string
  description?: string
  type?: string
  rarity?: string
  level?: number
  iconUrl?: string
  detailsType?: string
  detailsUnlockType?: string
  raw: Record<string, unknown>
}

function asRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(value: Record<string, unknown>, key: string): string | undefined {
  const field = value[key]
  return typeof field === 'string' ? sanitizeGw2Text(field) : undefined
}

function readNumber(value: Record<string, unknown>, key: string): number | undefined {
  const field = value[key]
  return typeof field === 'number' ? field : undefined
}

export function normalizeGw2Item(value: unknown): Gw2NormalizedItem | undefined {
  if (!asRecord(value)) {
    return undefined
  }

  const id = readNumber(value, 'id')
  if (id === undefined) {
    return undefined
  }

  const details = asRecord(value.details) ? value.details : undefined

  return {
    id,
    name: readString(value, 'name') ?? `Item ${id}`,
    description: readString(value, 'description'),
    type: readString(value, 'type'),
    rarity: readString(value, 'rarity'),
    level: readNumber(value, 'level'),
    iconUrl:
      readString(value, 'icon') ?? readString(value, 'iconUrl') ?? readString(value, 'icon_url'),
    detailsType: details ? readString(details, 'type') : undefined,
    detailsUnlockType: details ? readString(details, 'unlock_type') : undefined,
    raw: value,
  }
}

export function buildGw2ItemMap(entries: unknown[]): Map<number, Gw2NormalizedItem> {
  const items = new Map<number, Gw2NormalizedItem>()

  for (const entry of entries) {
    const normalized = normalizeGw2Item(entry)
    if (!normalized) {
      continue
    }

    items.set(normalized.id, normalized)
  }

  return items
}

export function buildGw2ItemMapFromEndpointResults(
  allResults: Gw2EndpointRunResult[],
  endpointIds: string[],
): Map<number, Gw2NormalizedItem> {
  const targetEndpoints = new Set(endpointIds)
  const mergedEntries = flattenPayloadEntries(
    allResults
      .filter((result) => targetEndpoints.has(result.endpointId))
      .flatMap((result) => result.payload),
  )

  return buildGw2ItemMap(mergedEntries)
}
