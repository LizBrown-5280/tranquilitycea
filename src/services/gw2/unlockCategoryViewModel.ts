import { flattenPayloadEntries, getSectionResults } from '@/services/gw2/aggregators/helpers'
import { parseUnlockIds } from '@/services/gw2/payloadParsers'
import type { Gw2EndpointRunResult } from '@/types/gw2'

export interface UnlockCategoryConfig {
  title: string
  catalogEndpoint: string
  accountEndpoint: string
  groupBy?: (item: UnlockItemViewModel) => string | undefined
}

export type UnlockSortMode = 'alphabetical' | 'order'

export interface UnlockDetailField {
  label: string
  value: string
  emphasis?: boolean
}

export interface UnlockItemViewModel {
  id: string
  order?: number
  name: string
  description?: string
  iconUrl?: string
  owned: boolean
  raw: Record<string, unknown>
  accountRaw?: Record<string, unknown>
}

interface UnlockRecord extends Record<string, unknown> {
  id?: string | number
  order?: number
  name?: string
  description?: string
  icon?: string
  iconUrl?: string
  icon_url?: string
  icon_big?: string
}

export function sanitizeGw2Text(value: string): string {
  return value
    .replace(/<c=[^>]*>/gi, '')
    .replace(/<\/c>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isRecord(value: unknown): value is UnlockRecord {
  return typeof value === 'object' && value !== null
}

function getIconUrl(entry: UnlockRecord): string | undefined {
  return entry.icon ?? entry.iconUrl ?? entry.icon_url ?? entry.icon_big
}

function normalizeValue(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value === 'string') {
    const sanitized = sanitizeGw2Text(value)
    return sanitized.length > 0 ? sanitized : undefined
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((entry) => normalizeValue(entry))
      .filter((entry): entry is string => Boolean(entry))

    return parts.length > 0 ? parts.join(', ') : undefined
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return undefined
    }
  }

  return undefined
}

function normalizeUnlockItem(
  entry: UnlockRecord,
  ownedIds: Set<string>,
  accountById: Map<string, Record<string, unknown>>,
): UnlockItemViewModel | undefined {
  const rawId = entry.id
  if (typeof rawId !== 'string' && typeof rawId !== 'number') {
    return undefined
  }

  const id = String(rawId)

  return {
    id,
    order: typeof entry.order === 'number' ? entry.order : undefined,
    name: sanitizeGw2Text(entry.name ?? `Unlock ${id}`),
    description: entry.description ? sanitizeGw2Text(entry.description) : undefined,
    iconUrl: getIconUrl(entry),
    owned: ownedIds.has(id),
    raw: entry,
    accountRaw: accountById.get(id),
  }
}

function buildAccountUnlockById(entries: unknown[]): Map<string, Record<string, unknown>> {
  const accountById = new Map<string, Record<string, unknown>>()

  for (const entry of entries) {
    if (typeof entry === 'string' || typeof entry === 'number') {
      accountById.set(String(entry), { id: entry })
      continue
    }

    if (!isRecord(entry)) {
      continue
    }

    const rawId = entry.id
    if (typeof rawId !== 'string' && typeof rawId !== 'number') {
      continue
    }

    accountById.set(String(rawId), entry)
  }

  return accountById
}

export function buildUnlockCategoryItems(
  allResults: Gw2EndpointRunResult[],
  config: UnlockCategoryConfig,
): UnlockItemViewModel[] {
  const sectionResults = getSectionResults('Account Unlocks', allResults)
  const catalogResult = sectionResults.find(
    (result) => result.endpointId === config.catalogEndpoint,
  )
  const accountResult = sectionResults.find(
    (result) => result.endpointId === config.accountEndpoint,
  )

  const ownedIds = new Set(
    parseUnlockIds(accountResult ? flattenPayloadEntries(accountResult.payload) : []),
  )
  const accountById = buildAccountUnlockById(
    accountResult ? flattenPayloadEntries(accountResult.payload) : [],
  )

  return flattenPayloadEntries(catalogResult ? catalogResult.payload : [])
    .filter(isRecord)
    .map((entry) => normalizeUnlockItem(entry, ownedIds, accountById))
    .filter((item): item is UnlockItemViewModel => Boolean(item))
    .sort((left, right) => left.name.localeCompare(right.name))
}

export function sortUnlockItems(
  items: UnlockItemViewModel[],
  sortMode: UnlockSortMode,
): UnlockItemViewModel[] {
  return [...items].sort((left, right) => {
    if (sortMode === 'order') {
      const leftOrder = left.order ?? Number.POSITIVE_INFINITY
      const rightOrder = right.order ?? Number.POSITIVE_INFINITY
      const orderDelta = leftOrder - rightOrder

      if (orderDelta !== 0) {
        return orderDelta
      }
    }

    return left.name.localeCompare(right.name)
  })
}

export function buildUnlockDetailFields(
  item: UnlockItemViewModel,
  keys: Array<{ key: string; label: string }>,
  options?: { includeDescription?: boolean },
): UnlockDetailField[] {
  const fields: UnlockDetailField[] = []
  const includeDescription = options?.includeDescription ?? true

  if (includeDescription && item.description) {
    fields.push({ label: 'Description', value: item.description })
  }

  for (const field of keys) {
    const value = normalizeValue(item.raw[field.key])
    if (!value) {
      continue
    }

    fields.push({ label: field.label, value })
  }

  return fields
}
