export type CanastaTeamId = 'teamA' | 'teamB'

export interface CanastaHandInputs {
  allRequirements: boolean
  requirement7s: number
  requirement5s: number
  requirementWilds: number
  requirementCleans: number
  requirementDirtys: number
  red3s: number
  row2CleanBooks: number
  row2DirtyBooks: number
  wentOut: boolean
  fastClean10Books: number
  fastClean5Books: number
  cardCount: number
  negCount: number
}

export interface CanastaHandTotals {
  bigCount: number
  fastCount: number
  cardCount: number
  negCount: number
  total: number
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
    row2CleanBooks: 0,
    row2DirtyBooks: 0,
    wentOut: false,
    fastClean10Books: 0,
    fastClean5Books: 0,
    cardCount: 0,
    negCount: 0,
  }
}
