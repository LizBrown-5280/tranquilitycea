import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import SwipeView from '@/views/SwipeView.vue'
import { SWIPE_MIN_PLAYERS } from '@/types/swipe'

class LocalStorageMock {
  private store: Record<string, string> = {}

  getItem(key: string): string | null {
    return this.store[key] ?? null
  }

  setItem(key: string, value: string): void {
    this.store[key] = value
  }

  removeItem(key: string): void {
    delete this.store[key]
  }

  clear(): void {
    this.store = {}
  }
}

describe('SwipeView', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new LocalStorageMock())
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    )
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    )
    vi.clearAllMocks()
  })

  async function enterTrackerWithNamedPlayers() {
    const wrapper = mount(SwipeView)
    await wrapper.find('[data-test="new-session-button"]').trigger('click')

    const playerInputs = wrapper.findAll('[data-test^="swipe-player-name-"]')
    for (const [index, input] of playerInputs.entries()) {
      await input.setValue(`Player ${index + 1}`)
    }

    await wrapper.find('[data-test="swipe-start-tracker-button"]').trigger('click')
    return wrapper
  }

  async function advanceToRound12(wrapper: ReturnType<typeof mount>, roundScores: number[]) {
    for (let round = 1; round < 12; round += 1) {
      for (let playerIndex = 1; playerIndex <= roundScores.length; playerIndex += 1) {
        const scoreInput = wrapper.find(`[data-test="swipe-score-input-r${round}-p${playerIndex}"]`)
        await scoreInput.setValue(String(roundScores[playerIndex - 1]))
        await scoreInput.trigger('change')
      }

      const nextRoundButton = wrapper.find('[data-test="swipe-next-round-button"]')
      expect((nextRoundButton.element as HTMLButtonElement).disabled).toBe(false)
      await nextRoundButton.trigger('click')
    }
  }

  it('shows session chooser on initial load', () => {
    const wrapper = mount(SwipeView)

    expect(wrapper.find('[data-test="new-session-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="session-type-modal"]').exists()).toBe(false)
  })

  it('creates a session directly from new session button with no popup', async () => {
    const wrapper = mount(SwipeView)
    await wrapper.find('[data-test="new-session-button"]').trigger('click')

    expect(wrapper.find('[data-test="session-type-modal"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="swipe-session-shell"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="swipe-setup-shell"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="swipe-tracker-shell"]').exists()).toBe(false)
  })

  it('renders Swipe header and keeps intro text while hiding mode text', () => {
    const wrapper = mount(SwipeView)

    expect(wrapper.text()).toContain('Swipe')
    expect(wrapper.text()).toContain('Scoring has never been simpler!')
    expect(wrapper.text()).not.toContain('Mode:')
    expect(wrapper.find('[data-test="settings-button"]').exists()).toBe(true)
  })

  it('shows back to sessions button after entering a session shell', async () => {
    const wrapper = mount(SwipeView)
    await wrapper.find('[data-test="new-session-button"]').trigger('click')

    expect(wrapper.find('[data-test="back-to-chooser-button"]').exists()).toBe(true)
  })

  it('starts setup with default minimum player count and matching player inputs', async () => {
    const wrapper = mount(SwipeView)
    await wrapper.find('[data-test="new-session-button"]').trigger('click')

    const countInput = wrapper.find('[data-test="swipe-player-count-input"]')
    expect((countInput.element as HTMLInputElement).value).toBe(String(SWIPE_MIN_PLAYERS))
    expect(wrapper.findAll('[data-test^="swipe-player-name-"]')).toHaveLength(SWIPE_MIN_PLAYERS)
  })

  it('grows player rows when player count increases in setup', async () => {
    const wrapper = mount(SwipeView)
    await wrapper.find('[data-test="new-session-button"]').trigger('click')

    const increment = wrapper.find('[data-test="swipe-player-count-increment"]')
    await increment.trigger('click')

    expect(wrapper.findAll('[data-test^="swipe-player-name-"]')).toHaveLength(SWIPE_MIN_PLAYERS + 1)
  })

  it('moves from setup shell to tracker shell when names are provided and start is tapped', async () => {
    const wrapper = mount(SwipeView)
    await wrapper.find('[data-test="new-session-button"]').trigger('click')

    const playerInputs = wrapper.findAll('[data-test^="swipe-player-name-"]')
    for (const [index, input] of playerInputs.entries()) {
      await input.setValue(`Player ${index + 1}`)
    }

    const startButton = wrapper.find('[data-test="swipe-start-tracker-button"]')
    expect((startButton.element as HTMLButtonElement).disabled).toBe(false)
    await startButton.trigger('click')

    expect(wrapper.find('[data-test="swipe-setup-shell"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="swipe-tracker-shell"]').exists()).toBe(true)
  })

  it('updates winner mode from setup controls', async () => {
    const wrapper = mount(SwipeView)
    await wrapper.find('[data-test="new-session-button"]').trigger('click')

    const minusTen = wrapper.find('[data-test="swipe-winner-mode-minus-ten"]')
    await minusTen.setValue(true)

    expect((minusTen.element as HTMLInputElement).checked).toBe(true)
  })

  it('renders sticky score grid after setup starts tracker', async () => {
    const wrapper = mount(SwipeView)
    await wrapper.find('[data-test="new-session-button"]').trigger('click')

    const playerInputs = wrapper.findAll('[data-test^="swipe-player-name-"]')
    for (const [index, input] of playerInputs.entries()) {
      await input.setValue(`Player ${index + 1}`)
    }

    await wrapper.find('[data-test="swipe-start-tracker-button"]').trigger('click')

    expect(wrapper.find('[data-test="swipe-score-grid"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="swipe-score-input-r1-p1"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="swipe-running-total-p1"]').text()).toBe('0')
  })

  it('updates running totals and clamps round score values to 3 digits', async () => {
    const wrapper = mount(SwipeView)
    await wrapper.find('[data-test="new-session-button"]').trigger('click')

    const playerInputs = wrapper.findAll('[data-test^="swipe-player-name-"]')
    for (const [index, input] of playerInputs.entries()) {
      await input.setValue(`Player ${index + 1}`)
    }

    await wrapper.find('[data-test="swipe-start-tracker-button"]').trigger('click')

    const firstScoreInput = wrapper.find('[data-test="swipe-score-input-r1-p1"]')
    await firstScoreInput.setValue('1200')
    await firstScoreInput.trigger('change')

    expect((firstScoreInput.element as HTMLInputElement).value).toBe('999')
    expect(wrapper.find('[data-test="swipe-running-total-p1"]').text()).toBe('999')

    await firstScoreInput.setValue('-1400')
    await firstScoreInput.trigger('change')

    expect((firstScoreInput.element as HTMLInputElement).value).toBe('-999')
    expect(wrapper.find('[data-test="swipe-running-total-p1"]').text()).toBe('-999')
  })

  it('keeps next round disabled until all current round scores are entered', async () => {
    const wrapper = mount(SwipeView)
    await wrapper.find('[data-test="new-session-button"]').trigger('click')

    const playerInputs = wrapper.findAll('[data-test^="swipe-player-name-"]')
    for (const [index, input] of playerInputs.entries()) {
      await input.setValue(`Player ${index + 1}`)
    }

    await wrapper.find('[data-test="swipe-start-tracker-button"]').trigger('click')

    const nextRoundButton = wrapper.find('[data-test="swipe-next-round-button"]')
    expect((nextRoundButton.element as HTMLButtonElement).disabled).toBe(true)

    for (let index = 1; index <= SWIPE_MIN_PLAYERS; index += 1) {
      const scoreInput = wrapper.find(`[data-test="swipe-score-input-r1-p${index}"]`)
      await scoreInput.setValue(String(index * 5))
      await scoreInput.trigger('change')
    }

    expect((nextRoundButton.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('enables next round as soon as typing begins in the last missing score input', async () => {
    const wrapper = mount(SwipeView)
    await wrapper.find('[data-test="new-session-button"]').trigger('click')

    const playerInputs = wrapper.findAll('[data-test^="swipe-player-name-"]')
    for (const [index, input] of playerInputs.entries()) {
      await input.setValue(`Player ${index + 1}`)
    }

    await wrapper.find('[data-test="swipe-start-tracker-button"]').trigger('click')

    const nextRoundButton = wrapper.find('[data-test="swipe-next-round-button"]')
    expect((nextRoundButton.element as HTMLButtonElement).disabled).toBe(true)

    const firstScoreInput = wrapper.find('[data-test="swipe-score-input-r1-p1"]')
    await firstScoreInput.setValue('10')
    await firstScoreInput.trigger('change')

    const secondScoreInput = wrapper.find('[data-test="swipe-score-input-r1-p2"]')
    await secondScoreInput.setValue('20')
    await secondScoreInput.trigger('change')

    const lastScoreInput = wrapper.find('[data-test="swipe-score-input-r1-p3"]')
    await lastScoreInput.setValue('1')
    await lastScoreInput.trigger('input')

    expect((nextRoundButton.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('advances to next round and rotates the starting player', async () => {
    const wrapper = mount(SwipeView)
    await wrapper.find('[data-test="new-session-button"]').trigger('click')

    const playerInputs = wrapper.findAll('[data-test^="swipe-player-name-"]')
    for (const [index, input] of playerInputs.entries()) {
      await input.setValue(`Player ${index + 1}`)
    }

    await wrapper.find('[data-test="swipe-start-tracker-button"]').trigger('click')

    for (let index = 1; index <= SWIPE_MIN_PLAYERS; index += 1) {
      const scoreInput = wrapper.find(`[data-test="swipe-score-input-r1-p${index}"]`)
      await scoreInput.setValue(String(index))
      await scoreInput.trigger('change')
    }

    const firstRowBefore = wrapper.findAll('.score-grid-row')[0]
    expect(firstRowBefore?.classes()).toContain('score-grid-row--starting')

    await wrapper.find('[data-test="swipe-next-round-button"]').trigger('click')

    expect(wrapper.find('[data-test="swipe-round-badge"]').text()).toContain('Round 2 / 12')

    const rowsAfter = wrapper.findAll('.score-grid-row')
    expect(rowsAfter[0]?.classes()).not.toContain('score-grid-row--starting')
    expect(rowsAfter[1]?.classes()).toContain('score-grid-row--starting')
  })

  it('hides the winner quick-fill bar once the game is locked after ending early', async () => {
    const wrapper = await enterTrackerWithNamedPlayers()

    const roundOneScores = [10, 20, 30]
    for (let playerIndex = 1; playerIndex <= roundOneScores.length; playerIndex += 1) {
      const scoreInput = wrapper.find(`[data-test="swipe-score-input-r1-p${playerIndex}"]`)
      await scoreInput.setValue(String(roundOneScores[playerIndex - 1]))
      await scoreInput.trigger('change')
    }

    await wrapper.find('[data-test="swipe-end-game-button"]').trigger('click')

    expect(wrapper.find('[data-test="swipe-winner-chip-bar"]').exists()).toBe(false)

    await wrapper.find('[data-test="swipe-continue-game-button"]').trigger('click')

    expect(wrapper.find('[data-test="swipe-winner-chip-bar"]').exists()).toBe(true)
  })

  it('does not show round-in-progress text in the status area by default', async () => {
    const wrapper = mount(SwipeView)
    await wrapper.find('[data-test="new-session-button"]').trigger('click')

    expect(wrapper.find('[data-test="swipe-round-status"]').exists()).toBe(false)
  })

  it('supports ending game early and still acknowledges the winner', async () => {
    const wrapper = await enterTrackerWithNamedPlayers()

    const roundOneScores = [10, 20, 30]
    for (let playerIndex = 1; playerIndex <= roundOneScores.length; playerIndex += 1) {
      const scoreInput = wrapper.find(`[data-test="swipe-score-input-r1-p${playerIndex}"]`)
      await scoreInput.setValue(String(roundOneScores[playerIndex - 1]))
      await scoreInput.trigger('change')
    }

    const endGameButton = wrapper.find('[data-test="swipe-end-game-button"]')
    expect((endGameButton.element as HTMLButtonElement).disabled).toBe(false)
    await endGameButton.trigger('click')

    expect(wrapper.find('[data-test="swipe-round-badge"]').text()).toContain('Round 1 / 12')
    expect(wrapper.find('[data-test="swipe-round-status"]').text()).toContain('Game complete')
    expect(wrapper.find('[data-test="swipe-next-round-button"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="swipe-end-game-button"]').exists()).toBe(false)

    const summary = wrapper.find('[data-test="swipe-game-complete-summary"]')
    expect(summary.exists()).toBe(true)
    expect(summary.text()).toContain('Winner: Player 1')

    expect(wrapper.find('[data-test="swipe-post-game-actions"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="swipe-leave-button"]').exists()).toBe(true)

    const continueButton = wrapper.find('[data-test="swipe-continue-game-button"]')
    expect(continueButton.exists()).toBe(true)
    expect((continueButton.element as HTMLButtonElement).disabled).toBe(false)

    await continueButton.trigger('click')

    expect(wrapper.find('[data-test="swipe-round-badge"]').text()).toContain('Round 1 / 12')
    expect(wrapper.find('[data-test="swipe-game-complete-summary"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="swipe-post-game-actions"]').exists()).toBe(false)
    expect(
      (wrapper.find('[data-test="swipe-score-input-r1-p1"]').element as HTMLInputElement).disabled,
    ).toBe(false)
  })

  it('shows completed rounds in badge when ending early during an unscored round', async () => {
    const wrapper = await enterTrackerWithNamedPlayers()

    const roundOneScores = [10, 20, 30]
    for (let playerIndex = 1; playerIndex <= roundOneScores.length; playerIndex += 1) {
      const scoreInput = wrapper.find(`[data-test="swipe-score-input-r1-p${playerIndex}"]`)
      await scoreInput.setValue(String(roundOneScores[playerIndex - 1]))
      await scoreInput.trigger('change')
    }

    await wrapper.find('[data-test="swipe-next-round-button"]').trigger('click')
    expect(wrapper.find('[data-test="swipe-round-badge"]').text()).toContain('Round 2 / 12')

    await wrapper.find('[data-test="swipe-end-game-button"]').trigger('click')
    expect(wrapper.find('[data-test="swipe-round-badge"]').text()).toContain('Round 1 / 12')
  })

  it('shows game-complete winner summary for lowest total after round 12', async () => {
    const wrapper = await enterTrackerWithNamedPlayers()

    await advanceToRound12(wrapper, [10, 20, 30])

    for (let playerIndex = 1; playerIndex <= SWIPE_MIN_PLAYERS; playerIndex += 1) {
      const scoreInput = wrapper.find(`[data-test="swipe-score-input-r12-p${playerIndex}"]`)
      await scoreInput.setValue(String(playerIndex * 10))
      await scoreInput.trigger('change')
    }

    expect(wrapper.find('[data-test="swipe-round-status"]').text()).toContain('Game complete')

    const summary = wrapper.find('[data-test="swipe-game-complete-summary"]')
    expect(summary.exists()).toBe(true)
    expect(summary.text()).toContain('Winner: Player 1')

    const player1Row = wrapper.find('[data-test="swipe-score-row-p1"]')
    const player2Row = wrapper.find('[data-test="swipe-score-row-p2"]')
    expect(player1Row.classes()).toContain('score-grid-row--winner')
    expect(player2Row.classes()).not.toContain('score-grid-row--winner')
  })

  it('shows tie summary when lowest totals are shared at game completion', async () => {
    const wrapper = await enterTrackerWithNamedPlayers()

    await advanceToRound12(wrapper, [10, 10, 20])

    for (let playerIndex = 1; playerIndex <= SWIPE_MIN_PLAYERS; playerIndex += 1) {
      const scoreInput = wrapper.find(`[data-test="swipe-score-input-r12-p${playerIndex}"]`)
      await scoreInput.setValue(String(playerIndex === 3 ? 20 : 10))
      await scoreInput.trigger('change')
    }

    const summary = wrapper.find('[data-test="swipe-game-complete-summary"]')
    expect(summary.exists()).toBe(true)
    expect(summary.text()).toContain('Tie: Player 1 & Player 2')

    const player1Row = wrapper.find('[data-test="swipe-score-row-p1"]')
    const player2Row = wrapper.find('[data-test="swipe-score-row-p2"]')
    const player3Row = wrapper.find('[data-test="swipe-score-row-p3"]')

    expect(player1Row.classes()).toContain('score-grid-row--winner')
    expect(player2Row.classes()).toContain('score-grid-row--winner')
    expect(player3Row.classes()).not.toContain('score-grid-row--winner')
  })

  it('auto-locks completed game without showing lock controls', async () => {
    const wrapper = await enterTrackerWithNamedPlayers()

    await advanceToRound12(wrapper, [10, 20, 30])

    const finalRoundP1 = wrapper.find('[data-test="swipe-score-input-r12-p1"]')
    const finalRoundP2 = wrapper.find('[data-test="swipe-score-input-r12-p2"]')
    const finalRoundP3 = wrapper.find('[data-test="swipe-score-input-r12-p3"]')

    await finalRoundP1.setValue('10')
    await finalRoundP1.trigger('change')
    await finalRoundP2.setValue('20')
    await finalRoundP2.trigger('change')
    await finalRoundP3.setValue('30')
    await finalRoundP3.trigger('change')

    expect(wrapper.find('[data-test="swipe-round-status"]').text()).toContain('Game complete')
    expect(wrapper.find('[data-test="swipe-game-complete-summary"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="swipe-post-game-actions"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="swipe-next-round-button"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="swipe-end-game-button"]').exists()).toBe(false)

    const continueButton = wrapper.find('[data-test="swipe-continue-game-button"]')
    expect((continueButton.element as HTMLButtonElement).disabled).toBe(true)
    expect(wrapper.find('[data-test="swipe-leave-button"]').exists()).toBe(true)

    const r1p1Input = wrapper.find('[data-test="swipe-score-input-r1-p1"]')
    expect((r1p1Input.element as HTMLInputElement).disabled).toBe(true)

    const p1TotalBeforeLockedEdit = wrapper.find('[data-test="swipe-running-total-p1"]').text()

    await r1p1Input.setValue('88')
    await r1p1Input.trigger('change')

    expect(wrapper.find('[data-test="swipe-running-total-p1"]').text()).toBe(
      p1TotalBeforeLockedEdit,
    )
  })

  it('allows leaving to session chooser from completed-game actions', async () => {
    const wrapper = await enterTrackerWithNamedPlayers()

    const roundOneScores = [10, 20, 30]
    for (let playerIndex = 1; playerIndex <= roundOneScores.length; playerIndex += 1) {
      const scoreInput = wrapper.find(`[data-test="swipe-score-input-r1-p${playerIndex}"]`)
      await scoreInput.setValue(String(roundOneScores[playerIndex - 1]))
      await scoreInput.trigger('change')
    }

    await wrapper.find('[data-test="swipe-end-game-button"]').trigger('click')

    const leaveButton = wrapper.find('[data-test="swipe-leave-button"]')
    expect(leaveButton.exists()).toBe(true)
    await leaveButton.trigger('click')

    expect(wrapper.find('[data-test="new-session-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="swipe-tracker-shell"]').exists()).toBe(false)
  })
})
