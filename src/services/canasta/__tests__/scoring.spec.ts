import { describe, expect, it } from 'vitest'

import { scoreCanastaHand } from '@/services/canasta/scoring'
import { createEmptyCanastaHandInputs } from '@/types/canasta'

describe('scoreCanastaHand', () => {
  it('adds all requirements bonus and keeps manual requirement input scoring', () => {
    const inputs = createEmptyCanastaHandInputs()
    inputs.requirement7s = 1
    inputs.requirementWilds = 2
    inputs.allRequirements = true

    const totals = scoreCanastaHand(inputs)

    expect(totals.bigCount).toBe(5000 + 5000 + 11300)
  })

  it('adds went-out bonus to big count', () => {
    const inputs = createEmptyCanastaHandInputs()
    inputs.wentOut = true

    const totals = scoreCanastaHand(inputs)

    expect(totals.bigCount).toBe(200)
  })

  it('scores red 3 cards with full-book and remainder rules', () => {
    const inputs = createEmptyCanastaHandInputs()
    inputs.red3s = 9

    const totals = scoreCanastaHand(inputs)

    expect(totals.bigCount).toBe(1200)
  })

  it('does not include removed second-row clean and dirty book values', () => {
    const legacyInputs = {
      ...createEmptyCanastaHandInputs(),
      row2CleanBooks: 10,
      row2DirtyBooks: 10,
    }

    const totals = scoreCanastaHand(legacyInputs)

    expect(totals.bigCount).toBe(0)
  })

  it('uses manual totals values when provided', () => {
    const inputs = createEmptyCanastaHandInputs()
    inputs.manualBigCount = 12500
    inputs.manualCardCount = 380
    inputs.manualPenaltyCount = 90

    const totals = scoreCanastaHand(inputs)

    expect(totals.bigCount).toBe(12500)
    expect(totals.fastCount).toBe(0)
    expect(totals.cardCount).toBe(380)
    expect(totals.penaltyCount).toBe(90)
    expect(totals.total).toBe(12790)
  })
})
