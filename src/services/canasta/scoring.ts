import type { CanastaHandInputs, CanastaHandTotals } from '@/types/canasta'

function clampNonNegativeInteger(value: number | string | null | undefined): number {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return 0
  }

  return Math.max(0, Math.trunc(parsed))
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
  const bigCount =
    requirementsSubtotal(inputs) + allRequirementsBonus(inputs) + secondRowSubtotal(inputs)
  const fastCount = fastCountSubtotal(inputs)
  const cardCount = clampNonNegativeInteger(inputs.cardCount)
  const negCount = clampNonNegativeInteger(inputs.negCount)

  return {
    bigCount,
    fastCount,
    cardCount,
    negCount,
    total: bigCount + fastCount + cardCount - negCount,
  }
}
