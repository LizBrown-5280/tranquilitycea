export const GW2_SECTIONS = [
  'Characters',
  'Inventories',
  'Account Unlocks',
  'Wallet',
  'Progression',
] as const

export type Gw2SectionName = (typeof GW2_SECTIONS)[number]

export type EndpointMode = 'single' | 'csvIds' | 'csvFrom' | 'paged' | 'byId' | 'expandFrom'

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

export interface Gw2BootstrapState {
  lifecycle: Gw2LifecycleStatus
  progress: Gw2Progress
  activeSectionName?: Gw2SectionName
  endpointErrors: Gw2EndpointError[]
  sections: Record<Gw2SectionName, Gw2SectionData>
}
