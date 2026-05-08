import type {
  CanastaSessionType,
  CanastaTeamId,
  HandTabId,
  CanastaTabId,
  CanastaHandInputs,
} from '@/types/canasta'
import { createEmptyCanastaHandInputs } from '@/types/canasta'

export interface HandTabMeta {
  id: HandTabId
  label: string
}

export interface TeamMeta {
  id: CanastaTeamId
  label: string
}

export interface SessionTypeOption {
  id: CanastaSessionType
  label: string
}

export const HAND_TABS: HandTabMeta[] = [
  { id: 'hand1', label: '1' },
  { id: 'hand2', label: '2' },
  { id: 'hand3', label: '3' },
  { id: 'hand4', label: '4' },
]

export const TOTALS_TAB: { id: CanastaTabId; label: string } = { id: 'totals', label: 'Totals' }

export const TEAMS: TeamMeta[] = [
  { id: 'teamWe', label: 'We' },
  { id: 'teamThey', label: 'Them' },
]

export const SESSION_TYPE_OPTIONS: SessionTypeOption[] = [
  { id: 'myTeamOnly', label: "My Team Full Scoring + Opponent's Totals" },
  { id: 'bothTeams', label: 'Both Teams Full Scoring' },
  { id: 'totalScoresOnly', label: 'Both Teams Totals Only' },
]

export function createDefaultHandState(): Record<
  HandTabId,
  Record<CanastaTeamId, CanastaHandInputs>
> {
  return HAND_TABS.reduce(
    (accumulator, tab) => {
      accumulator[tab.id] = {
        teamWe: createEmptyCanastaHandInputs(),
        teamThey: createEmptyCanastaHandInputs(),
      }
      return accumulator
    },
    {} as Record<HandTabId, Record<CanastaTeamId, CanastaHandInputs>>,
  )
}

export function cloneHandState(
  source: Record<HandTabId, Record<CanastaTeamId, CanastaHandInputs>>,
): Record<HandTabId, Record<CanastaTeamId, CanastaHandInputs>> {
  return JSON.parse(JSON.stringify(source)) as Record<
    HandTabId,
    Record<CanastaTeamId, CanastaHandInputs>
  >
}
