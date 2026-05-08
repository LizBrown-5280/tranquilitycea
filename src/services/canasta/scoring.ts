import type { CanastaHandInputs, CanastaHandTotals } from '@/types/canasta'

function clampNonNegativeInteger(value: number | string | null | undefined): number {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return 0
  }

  return Math.max(0, Math.trunc(parsed))
}

function hasManualTotals(inputs: CanastaHandInputs): boolean {
  return [inputs.manualBigCount, inputs.manualCardCount, inputs.manualPenaltyCount].some(
    (value) => value !== null && value !== undefined,
  )
}

function requirementsSubtotal(inputs: CanastaHandInputs): number {
  return (
    clampNonNegativeInteger(inputs.requirement7s) * 5000 +
    clampNonNegativeInteger(inputs.requirement5s) * 3000 +
    clampNonNegativeInteger(inputs.requirementWilds) * 2500 +
    clampNonNegativeInteger(inputs.requirementCleans) * 500 +
    clampNonNegativeInteger(inputs.requirementDirtys) * 300
  )
}

function red3Subtotal(red3Count: number): number {
  const sanitized = clampNonNegativeInteger(red3Count)
  const fullBooks = Math.floor(sanitized / 7)
  const remainderCards = sanitized % 7

  return fullBooks * 1000 + remainderCards * 100
}

function secondRowSubtotal(inputs: CanastaHandInputs): number {
  return red3Subtotal(inputs.red3s) + (inputs.wentOut ? 200 : 0)
}

function allRequirementsBonus(inputs: CanastaHandInputs): number {
  return inputs.allRequirements ? 11300 : 0
}

function fastCountSubtotal(inputs: CanastaHandInputs): number {
  return (
    clampNonNegativeInteger(inputs.fastClean10Books) * 70 +
    clampNonNegativeInteger(inputs.fastClean5Books) * 35 +
    clampNonNegativeInteger(inputs.fastCleanABooks) * 140
  )
}

export function scoreCanastaHand(inputs: CanastaHandInputs): CanastaHandTotals {
  if (hasManualTotals(inputs)) {
    const bigCount = clampNonNegativeInteger(inputs.manualBigCount)
    const fastCount = 0
    const cardCount = clampNonNegativeInteger(inputs.manualCardCount)
    const penaltyCount = clampNonNegativeInteger(inputs.manualPenaltyCount)

    return {
      bigCount,
      fastCount,
      cardCount,
      penaltyCount,
      total: bigCount + cardCount - penaltyCount,
    }
  }

  const bigCount =
    requirementsSubtotal(inputs) + allRequirementsBonus(inputs) + secondRowSubtotal(inputs)
  const fastCount = fastCountSubtotal(inputs)
  const cardCount = clampNonNegativeInteger(inputs.cardCount)
  const penaltyCount = clampNonNegativeInteger(inputs.penaltyCount)

  return {
    bigCount,
    fastCount,
    cardCount,
    penaltyCount,
    total: bigCount + fastCount + cardCount - penaltyCount,
  }
}

export function createHandFromManualTotals(
  bigCount: number,
  cardCount: number,
  penaltyCount: number,
): Partial<CanastaHandInputs> {
  return {
    manualBigCount: clampNonNegativeInteger(bigCount),
    manualCardCount: clampNonNegativeInteger(cardCount),
    manualPenaltyCount: clampNonNegativeInteger(penaltyCount),
  }
}
