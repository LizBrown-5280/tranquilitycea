export const GW2_SECTIONS = [
  'Characters',
  'Inventories',
  'Account Unlocks',
  'Wallet',
  'Progression',
] as const

export type Gw2SectionName = (typeof GW2_SECTIONS)[number]

export type EndpointMode =
  | 'single'
  | 'csvIds'
  | 'csvFrom'
  | 'csvGraphFrom'
  | 'paged'
  | 'byId'
  | 'expandFrom'

export type Gw2EndpointScope = 'public' | 'account'

export const GW2_API_KEY_SCOPES = [
  'account',
  'builds',
  'characters',
  'inventories',
  'wallet',
  'unlocks',
  'progression',
] as const

export type Gw2ApiKeyScope = (typeof GW2_API_KEY_SCOPES)[number]

export type Gw2EndpointErrorType =
  | 'missingScope'
  | 'invalidKey'
  | 'parser'
  | 'http'
  | 'network'
  | 'unknown'

export type Gw2SectionState = 'available' | 'partial' | 'empty' | 'locked/no-key'

export type Gw2LifecycleStatus =
  | 'idle'
  | 'loadingPublic'
  | 'loadingAccount'
  | 'complete'
  | 'partialError'
  | 'fatalError'

export interface Gw2MetricCard {
  id: string
  label: string
  value: string
  description: string
  iconUrl?: string
  tone?: 'highlight' | 'good' | 'attention' | 'neutral'
  badge?: string
}

export interface Gw2SectionData {
  name: Gw2SectionName
  state: Gw2SectionState
  summary: string
  metrics: Gw2MetricCard[]
  records: string[]
}

export interface Gw2Progress {
  completed: number
  total: number
}

export interface Gw2EndpointError {
  endpoint: string
  message: string
  errorType?: Gw2EndpointErrorType
  requiredScopes?: Gw2ApiKeyScope[]
}

interface Gw2EndpointDefinitionBase {
  id: string
  description: string
  scope: Gw2EndpointScope
  section: Gw2SectionName
  mode: EndpointMode
  path: string
  requiredScopes?: Gw2ApiKeyScope[]
}

export interface Gw2SingleEndpointDefinition extends Gw2EndpointDefinitionBase {
  mode: 'single'
}

export interface Gw2CsvIdsEndpointDefinition extends Gw2EndpointDefinitionBase {
  mode: 'csvIds'
  csvParam?: string
  chunkSize?: number
  staticIds: Array<string | number>
}

export interface Gw2CsvFromEndpointDefinition extends Gw2EndpointDefinitionBase {
  mode: 'csvFrom'
  dependsOn: string
  extractIds: (dependencyPayload: unknown[]) => Array<string | number>
  csvParam?: string
  chunkSize?: number
}

export interface Gw2CsvGraphFromEndpointDefinition extends Gw2EndpointDefinitionBase {
  mode: 'csvGraphFrom'
  dependsOn: string
  extractIds: (dependencyPayload: unknown[]) => Array<string | number>
  csvParam?: string
  chunkSize?: number
  maxGraphDepth?: number
  /** Optional identifier for category-specific relation extraction */
  relationId?: string
}

export interface Gw2PagedEndpointDefinition extends Gw2EndpointDefinitionBase {
  mode: 'paged'
  pageParam?: string
  pageSizeParam?: string
  pageSize?: number
  maxPages?: number
}

export interface Gw2ByIdEndpointDefinition extends Gw2EndpointDefinitionBase {
  mode: 'byId'
  staticIds: Array<string | number>
  idPathTemplate?: string
}

export interface Gw2ExpandFromEndpointDefinition extends Gw2EndpointDefinitionBase {
  mode: 'expandFrom'
  dependsOn: string
  idPathTemplate: string
  extractIds: (dependencyPayload: unknown[]) => Array<string | number>
}

export type Gw2EndpointDefinition =
  | Gw2SingleEndpointDefinition
  | Gw2CsvIdsEndpointDefinition
  | Gw2CsvFromEndpointDefinition
  | Gw2CsvGraphFromEndpointDefinition
  | Gw2PagedEndpointDefinition
  | Gw2ByIdEndpointDefinition
  | Gw2ExpandFromEndpointDefinition

export interface Gw2EndpointRunResult {
  endpointId: string
  section: Gw2SectionName
  scope: Gw2EndpointScope
  mode: EndpointMode
  ok: boolean
  requestCount: number
  payload: unknown[]
  error?: string
  errorType?: Gw2EndpointErrorType
  requiredScopes?: Gw2ApiKeyScope[]
}

export interface Gw2EndpointBatchResult {
  results: Gw2EndpointRunResult[]
  payloadByEndpoint: Record<string, unknown[]>
}

/**
 * Unified hover detail for an unlock item with related items resolved.
 * This structure allows consistent rendering across different unlock categories.
 */
export interface Gw2UnlockDetailItem {
  id: string | number
  name: string
  description?: string
  iconUrl?: string
  type?: string
  rarity?: string
  level?: number
  /** Related item details resolved from relation fields */
  relatedItems?: {
    relationName: string
    items: Gw2UnlockDetailItem[]
  }[]
  /** Raw API response for category-specific fields */
  raw: Record<string, unknown>
}

/**
 * Represents a single dye slot on a mount skin with resolved color info.
 */
export interface Gw2MountDyeSlot {
  id: number
  colorId: number
  colorName?: string
}

/**
 * Represents a mount skin with all display properties.
 */
export interface Gw2MountSkin {
  id: number
  name: string
  icon?: string
  dyeSlots?: Gw2MountDyeSlot[]
  owned?: boolean
}

/**
 * Represents a mount type with its associated skins.
 */
export interface Gw2MountType {
  id: string
  name: string
  defaultSkinId?: number
  skins: Gw2MountSkin[]
}

/**
 * Mount data organized by type for display.
 */
export interface Gw2MountsOrganized {
  byType: Gw2MountType[]
  totalSkins: number
  ownedSkins: number
}

export interface Gw2BootstrapState {
  lifecycle: Gw2LifecycleStatus
  progress: Gw2Progress
  activeSectionName?: Gw2SectionName
  endpointErrors: Gw2EndpointError[]
  sections: Record<Gw2SectionName, Gw2SectionData>
}
