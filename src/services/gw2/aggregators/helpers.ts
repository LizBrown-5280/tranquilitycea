import type {
  Gw2MetricCard,
  Gw2SectionData,
  Gw2SectionName,
  Gw2SectionState,
  Gw2EndpointRunResult,
} from '@/types/gw2'

const SECTION_SUMMARIES: Record<Gw2SectionName, string> = {
  Characters: 'Character roster and core profession details',
  Inventories: 'Bag contents and material storage snapshots',
  'Account Unlocks': 'Account-owned cosmetics and feature unlock collections',
  Wallet: 'Currencies and account-wide balances',
  Progression: 'Masteries, achievements, and story milestones',
}

const LOCKED_WITHOUT_KEY = new Set<Gw2SectionName>(['Characters', 'Inventories', 'Account Unlocks'])

export function getSectionSummary(sectionName: Gw2SectionName): string {
  return SECTION_SUMMARIES[sectionName]
}

export function getSectionResults(
  sectionName: Gw2SectionName,
  allResults: Gw2EndpointRunResult[],
): Gw2EndpointRunResult[] {
  return allResults.filter((result) => result.section === sectionName)
}

export function flattenPayloadEntries(payload: unknown[]): unknown[] {
  const flattened: unknown[] = []

  for (const payloadEntry of payload) {
    if (Array.isArray(payloadEntry)) {
      flattened.push(...payloadEntry)
      continue
    }

    flattened.push(payloadEntry)
  }

  return flattened
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asValidIconUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    return undefined
  }

  return value
}

export function extractIconUrl(entries: unknown[]): string | undefined {
  const iconKeys = ['icon', 'iconUrl', 'icon_url', 'icon_big', 'iconBig']

  for (const entry of entries) {
    if (!isObjectRecord(entry)) {
      continue
    }

    for (const iconKey of iconKeys) {
      const maybeIcon = asValidIconUrl(entry[iconKey])
      if (maybeIcon) {
        return maybeIcon
      }
    }
  }

  return undefined
}

export function createMetricCard(
  id: string,
  label: string,
  value: string | number,
  description: string,
  iconUrl?: string,
  options?: Pick<Gw2MetricCard, 'tone' | 'badge'>,
): Gw2MetricCard {
  return {
    id,
    label,
    value: String(value),
    description,
    iconUrl,
    tone: options?.tone,
    badge: options?.badge,
  }
}

export function deriveSectionState(
  sectionName: Gw2SectionName,
  sectionResults: Gw2EndpointRunResult[],
  hasKey: boolean,
): Gw2SectionState {
  if (!hasKey && LOCKED_WITHOUT_KEY.has(sectionName)) {
    return 'locked/no-key'
  }

  if (sectionResults.length === 0) {
    return 'empty'
  }

  const hasData = sectionResults.some((result) => result.payload.length > 0)
  const hasErrors = sectionResults.some((result) => !result.ok)

  if (hasErrors) {
    return 'partial'
  }

  if (hasData) {
    return 'available'
  }

  return 'empty'
}

export function createSectionRecords(sectionResults: Gw2EndpointRunResult[]): string[] {
  return sectionResults.map((result) => {
    const payloadCount = result.payload.length
    const status = result.ok ? 'ok' : 'error'
    return `${result.endpointId} (${result.mode}) -> ${payloadCount} payload(s), ${status}`
  })
}

export function aggregateSection(
  sectionName: Gw2SectionName,
  allResults: Gw2EndpointRunResult[],
  hasKey: boolean,
): Gw2SectionData {
  const sectionResults = getSectionResults(sectionName, allResults)
  const records = createSectionRecords(sectionResults)

  return {
    name: sectionName,
    state: deriveSectionState(sectionName, sectionResults, hasKey),
    summary: getSectionSummary(sectionName),
    metrics: [
      createMetricCard(
        `${sectionName.toLowerCase()}-endpoint-count`,
        'Endpoints',
        sectionResults.length,
        'Total endpoint definitions contributing to this section in the current run.',
      ),
      createMetricCard(
        `${sectionName.toLowerCase()}-payload-count`,
        'Payloads',
        sectionResults.reduce((count, result) => count + result.payload.length, 0),
        'Total payload groups produced by endpoints mapped to this section.',
      ),
    ],
    records,
  }
}

export function createInitialSection(sectionName: Gw2SectionName): Gw2SectionData {
  return {
    name: sectionName,
    state: 'locked/no-key',
    summary: getSectionSummary(sectionName),
    metrics: [],
    records: [],
  }
}
