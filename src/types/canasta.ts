export type CanastaTeamId = 'teamA' | 'teamB'
export type HandTabId = 'hand1' | 'hand2' | 'hand3' | 'hand4'
export type CanastaTabId = HandTabId | 'totals'

/** Session type determines how scoring is tracked. */
export type CanastaSessionType = 'myTeamOnly' | 'bothTeams' | 'totalScoresOnly'

export interface CanastaHandInputs {
  allRequirements: boolean
  requirement7s: number
  requirement5s: number
  requirementWilds: number
  requirementCleans: number
  requirementDirtys: number
  red3s: number
  wentOut: boolean
  fastClean10Books: number
  fastClean5Books: number
  fastCleanABooks: number
  cardCount: number
  penaltyCount: number
  manualBigCount: number | null
  manualCardCount: number | null
  manualPenaltyCount: number | null
}

export interface CanastaHandTotals {
  bigCount: number
  fastCount: number
  cardCount: number
  penaltyCount: number
  total: number
}

/**
 * Represents a complete Canasta game session with metadata and full hand state.
 * Persisted to localStorage for recovery after accidental navigation/refresh.
 */
export interface CanastaSessionEnvelope {
  /** Unix timestamp in milliseconds when session was created. Used as session ID. */
  sessionId: number
  /** Unix timestamp in milliseconds when session was created. */
  createdAt: number
  /** Unix timestamp in milliseconds when session was last modified. */
  updatedAt: number
  /** How the player is tracking scoring for this session. */
  sessionType: CanastaSessionType
  /** Current active tab (hand1-4 or totals). */
  activeTab: CanastaTabId
  /** Full 4-hand × 2-team scoring matrix. */
  handState: Record<HandTabId, Record<CanastaTeamId, CanastaHandInputs>>
  /** Schema version for future migrations. */
  schemaVersion: number
}

export function createEmptyCanastaHandInputs(): CanastaHandInputs {
  return {
    allRequirements: false,
    requirement7s: 0,
    requirement5s: 0,
    requirementWilds: 0,
    requirementCleans: 0,
    requirementDirtys: 0,
    red3s: 0,
    wentOut: false,
    fastClean10Books: 0,
    fastClean5Books: 0,
    fastCleanABooks: 0,
    cardCount: 0,
    penaltyCount: 0,
    manualBigCount: null,
    manualCardCount: null,
    manualPenaltyCount: null,
  }
}

/** Create a new session envelope with empty hand state and provided session type. */
export function createEmptyCanastaSessionEnvelope(
  sessionType: CanastaSessionType,
  now: number = Date.now(),
): CanastaSessionEnvelope {
  const HAND_TABS: HandTabId[] = ['hand1', 'hand2', 'hand3', 'hand4']
  const TEAMS: CanastaTeamId[] = ['teamA', 'teamB']

  const handState = {} as Record<HandTabId, Record<CanastaTeamId, CanastaHandInputs>>
  for (const handId of HAND_TABS) {
    handState[handId] = {} as Record<CanastaTeamId, CanastaHandInputs>
    for (const teamId of TEAMS) {
      handState[handId][teamId] = createEmptyCanastaHandInputs()
    }
  }

  return {
    sessionId: now,
    createdAt: now,
    updatedAt: now,
    sessionType,
    activeTab: 'hand1',
    handState,
    schemaVersion: 1,
  }
}
