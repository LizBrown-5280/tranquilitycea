<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import swipeLogoUrl from '@/assets/swipe.png'
import CanastaSessionSelector from '@/components/canasta/CanastaSessionSelector.vue'
import SwipeSettingsModal from '@/components/swipe/SwipeSettingsModal.vue'
import { useSwipeSession } from '@/composables/useSwipeSession'
import {
  getSessionRetentionDays,
  getTooltipsEnabled,
  saveSession,
  setSessionRetentionDays,
  setTooltipsEnabled,
} from '@/services/swipe/sessionStorage'
import {
  SWIPE_MAX_PLAYERS,
  SWIPE_MIN_PLAYERS,
  SWIPE_SCORE_MAX,
  SWIPE_SCORE_MIN,
  SWIPE_TOTAL_ROUNDS,
  clampSwipePlayerCount,
  createEmptySwipeSessionEnvelope,
  normalizeSwipeScore,
  type SwipeSessionEnvelope,
  type SwipeWinnerValueMode,
  updateSwipePlayerName,
  updateSwipeSessionPlayers,
} from '@/types/swipe'
import {
  getSwipeDisplayName,
  hasMinimumNamedPlayers,
  getTruncatedSwipeName,
} from '@/services/swipe/swipeConstants'

const {
  allStoredSessions,
  activeSession,
  isArchivedReadOnly,
  sessionChooserState,
  isEntryTransitionRunning,
  currentSessionOption,
  previousSessionOptions,
  refreshStoredSessions,
  initializeSessionChooser,
  beginSessionEntryTransition,
  clearAllSessions,
  queueEntryTransitionStep,
  prefersReducedMotion,
  destroy,
} = useSwipeSession()

const settingsPanelState = ref<'showing' | 'hidden'>('hidden')
const retentionDays = ref<number>(90)
const tooltipsEnabled = ref<boolean>(true)
const roundAdvancePulsePlayerId = ref<string | null>(null)
let roundAdvancePulseTimerId: number | null = null
const headerLogoRef = ref<HTMLElement | null>(null)
const entryTransitionMetrics = ref({
  startX: 0,
  startY: 0,
  startScale: 0.28,
  endX: 0,
  endY: -140,
  endScale: 0.28,
  targetSize: 320,
})

const ENTRY_TRANSITION_TOTAL_MS = 1700
const NEW_SESSION_START_DELAY_MS = 80

const setupPlayerCount = ref<number>(SWIPE_MIN_PLAYERS)
const roundNumbers = Array.from({ length: SWIPE_TOTAL_ROUNDS }, (_, index) => index + 1)

const shouldRenderChooserContent = computed(() => {
  return sessionChooserState.value === 'showing' || isEntryTransitionRunning.value
})

const shouldRenderSessionContent = computed(() => {
  return (
    activeSession.value !== null &&
    (sessionChooserState.value === 'hidden' || isEntryTransitionRunning.value)
  )
})

const isSetupShell = computed(() => activeSession.value?.shellState === 'setup')
const isTrackerShell = computed(() => activeSession.value?.shellState === 'tracker')

const namedPlayerValues = computed(
  () => activeSession.value?.players.map((player) => player.name) ?? [],
)

const canStartTracker = computed(() => {
  return hasMinimumNamedPlayers(namedPlayerValues.value, setupPlayerCount.value)
})

const trackerPlayerPreview = computed(() => {
  return (activeSession.value?.players ?? []).map((player, index) => {
    const fullName = getSwipeDisplayName(player.name, index)
    return {
      id: player.id,
      fullName,
      shortName: getTruncatedSwipeName(fullName),
    }
  })
})

const runningTotalsByPlayer = computed(() => {
  const totals: Record<string, number> = {}

  for (const player of activeSession.value?.players ?? []) {
    totals[player.id] = 0
  }

  if (!activeSession.value) {
    return totals
  }

  for (const round of roundNumbers) {
    const roundScores = activeSession.value.scoresByRound[round] ?? {}
    for (const player of activeSession.value.players) {
      const value = roundScores[player.id]
      if (typeof value === 'number') {
        totals[player.id] += value
      }
    }
  }

  return totals
})

const activeRound = computed(() => activeSession.value?.currentRound ?? 1)

const isFinalRound = computed(() => activeRound.value >= SWIPE_TOTAL_ROUNDS)

const isCurrentRoundComplete = computed(() => {
  if (!activeSession.value) {
    return false
  }

  const roundScores = activeSession.value.scoresByRound[activeRound.value] ?? {}
  return activeSession.value.players.every((player) => typeof roundScores[player.id] === 'number')
})

const canAdvanceRound = computed(() => {
  return (
    !!activeSession.value &&
    !isArchivedReadOnly.value &&
    isCurrentRoundComplete.value &&
    !isFinalRound.value
  )
})

const canEndGameEarly = computed(() => {
  return (
    !!activeSession.value &&
    !isArchivedReadOnly.value &&
    !isGameLocked.value &&
    !isGameComplete.value
  )
})

const trackerStatusLabel = computed(() => {
  if (isArchivedReadOnly.value) {
    return 'Read-only archive'
  }

  if (isFinalRound.value && isCurrentRoundComplete.value) {
    return 'Game complete'
  }

  return isCurrentRoundComplete.value ? 'Round complete' : ''
})

const isGameComplete = computed(() => isFinalRound.value && isCurrentRoundComplete.value)
const isGameLocked = computed(() => activeSession.value?.isGameLocked ?? false)
const endedEarlyRound = computed(() => activeSession.value?.endedEarlyRound ?? null)
const isTrackerReadOnly = computed(() => isArchivedReadOnly.value || isGameLocked.value)

const canContinueGame = computed(() => {
  return (
    !!activeSession.value &&
    !isArchivedReadOnly.value &&
    isGameLocked.value &&
    endedEarlyRound.value !== null
  )
})

const winnerPlayerIds = computed(() => {
  if (!isGameComplete.value || !activeSession.value) {
    return [] as string[]
  }

  const playerIds = activeSession.value.players.map((player) => player.id)
  if (playerIds.length === 0) {
    return [] as string[]
  }

  const minTotal = Math.min(
    ...playerIds.map((playerId) => runningTotalsByPlayer.value[playerId] ?? 0),
  )
  return playerIds.filter((playerId) => (runningTotalsByPlayer.value[playerId] ?? 0) === minTotal)
})

const winnerSummaryText = computed(() => {
  if (!isGameComplete.value || winnerPlayerIds.value.length === 0) {
    return ''
  }

  const winnerNames = trackerPlayerPreview.value
    .filter((player) => winnerPlayerIds.value.includes(player.id))
    .map((player) => player.fullName)

  const winningTotal = runningTotalsByPlayer.value[winnerPlayerIds.value[0]] ?? 0

  if (winnerNames.length === 1) {
    return `Winner: ${winnerNames[0]} (${winningTotal})`
  }

  return `Tie: ${winnerNames.join(' & ')} (${winningTotal})`
})

const winnerAutofillValue = computed(() => {
  return activeSession.value?.winnerValueMode === 'minusTen' ? -10 : 0
})

const logoOverlayStyle = computed(() => {
  return {
    '--entry-logo-start-x': `${entryTransitionMetrics.value.startX}px`,
    '--entry-logo-start-y': `${entryTransitionMetrics.value.startY}px`,
    '--entry-logo-start-scale': String(entryTransitionMetrics.value.startScale),
    '--entry-logo-end-x': `${entryTransitionMetrics.value.endX}px`,
    '--entry-logo-end-y': `${entryTransitionMetrics.value.endY}px`,
    '--entry-logo-end-scale': String(entryTransitionMetrics.value.endScale),
    '--entry-logo-target-size': `${entryTransitionMetrics.value.targetSize}px`,
    '--entry-transition-duration': `${ENTRY_TRANSITION_TOTAL_MS}ms`,
  }
})

function measureEntryTransitionMetrics() {
  if (typeof window === 'undefined') {
    return {
      startX: 0,
      startY: -140,
      startScale: 0.28,
      endX: 0,
      endY: -140,
      endScale: 0.28,
      targetSize: 320,
    }
  }

  const viewportMin = Math.min(window.innerWidth, window.innerHeight)
  const targetSize = Math.min(viewportMin * 0.92, 400)
  const fallbackStartY = -Math.min(window.innerHeight * 0.24, 180)
  const rect = headerLogoRef.value?.getBoundingClientRect()

  if (!rect) {
    return {
      startX: 0,
      startY: fallbackStartY,
      startScale: 100 / targetSize,
      endX: 0,
      endY: fallbackStartY,
      endScale: 100 / targetSize,
      targetSize,
    }
  }

  return {
    startX: rect.left + rect.width / 2 - window.innerWidth / 2,
    startY: rect.top + rect.height / 2 - window.innerHeight / 2,
    startScale: Math.max(rect.width / targetSize, 0.18),
    endX: rect.left + rect.width / 2 - window.innerWidth / 2,
    endY: rect.top + rect.height / 2 - window.innerHeight / 2,
    endScale: Math.max(rect.width / targetSize, 0.18),
    targetSize,
  }
}

async function runSessionEntryTransition(
  session: SwipeSessionEnvelope,
  isArchivedSession: boolean,
  hydrationCallback: (hydration: { session: SwipeSessionEnvelope }) => void,
) {
  entryTransitionMetrics.value = measureEntryTransitionMetrics()
  await beginSessionEntryTransition(session, isArchivedSession, hydrationCallback)
}

async function loadCurrentSession() {
  if (!currentSessionOption.value || isEntryTransitionRunning.value) {
    return
  }

  await runSessionEntryTransition(currentSessionOption.value, false, ({ session }) => {
    setupPlayerCount.value = clampSwipePlayerCount(session.players.length)
  })
}

async function loadPreviousSession(sessionId: number) {
  if (isEntryTransitionRunning.value) {
    return
  }

  const selectedSession = previousSessionOptions.value.find(
    (session) => session.sessionId === sessionId,
  )

  if (!selectedSession) {
    return
  }

  await runSessionEntryTransition(selectedSession, true, ({ session }) => {
    setupPlayerCount.value = clampSwipePlayerCount(session.players.length)
  })
}

async function createNewSession() {
  const newSession = createEmptySwipeSessionEnvelope()
  saveSession(newSession)

  if (!prefersReducedMotion()) {
    await new Promise<void>((resolve) => {
      queueEntryTransitionStep(() => resolve(), NEW_SESSION_START_DELAY_MS)
    })
  }

  await runSessionEntryTransition(newSession, false, ({ session }) => {
    setupPlayerCount.value = clampSwipePlayerCount(session.players.length)
  })
}

function setSetupPlayerCount(nextCount: number) {
  const normalizedCount = clampSwipePlayerCount(nextCount)
  setupPlayerCount.value = normalizedCount

  if (!activeSession.value) {
    return
  }

  const updatedSession = updateSwipeSessionPlayers(activeSession.value, normalizedCount)
  persistSwipeSession(updatedSession)
}

function updateSetupPlayerName(playerId: string, nextName: string) {
  if (!activeSession.value) {
    return
  }

  const updatedSession = updateSwipePlayerName(activeSession.value, playerId, nextName)
  persistSwipeSession(updatedSession)
}

function updateWinnerMode(nextMode: SwipeWinnerValueMode) {
  if (!activeSession.value) {
    return
  }

  const updatedSession: SwipeSessionEnvelope = {
    ...activeSession.value,
    winnerValueMode: nextMode,
    updatedAt: Date.now(),
  }

  persistSwipeSession(updatedSession)
}

function beginTrackerFromSetup() {
  if (!activeSession.value || !canStartTracker.value) {
    return
  }

  const normalizedPlayers = activeSession.value.players.map((player, index) => {
    const fullName = getSwipeDisplayName(player.name, index)
    return {
      ...player,
      name: fullName,
    }
  })

  const updatedSession: SwipeSessionEnvelope = {
    ...activeSession.value,
    players: normalizedPlayers,
    shellState: 'tracker',
    updatedAt: Date.now(),
  }

  persistSwipeSession(updatedSession)
}

function clearRoundAdvancePulseTimer() {
  if (roundAdvancePulseTimerId !== null) {
    window.clearTimeout(roundAdvancePulseTimerId)
    roundAdvancePulseTimerId = null
  }
}

function triggerRoundAdvancePulse(nextPlayerId: string) {
  if (prefersReducedMotion()) {
    roundAdvancePulsePlayerId.value = null
    return
  }

  clearRoundAdvancePulseTimer()
  roundAdvancePulsePlayerId.value = nextPlayerId
  roundAdvancePulseTimerId = window.setTimeout(() => {
    roundAdvancePulsePlayerId.value = null
    roundAdvancePulseTimerId = null
  }, 900)
}

function advanceToNextRound() {
  if (!activeSession.value || !canAdvanceRound.value) {
    return
  }

  const nextRound = Math.min(activeSession.value.currentRound + 1, SWIPE_TOTAL_ROUNDS)
  const nextStartingPlayerIndex =
    activeSession.value.players.length > 0
      ? (activeSession.value.currentStartingPlayerIndex + 1) % activeSession.value.players.length
      : 0

  const updatedSession: SwipeSessionEnvelope = {
    ...activeSession.value,
    currentRound: nextRound,
    currentStartingPlayerIndex: nextStartingPlayerIndex,
    updatedAt: Date.now(),
  }

  persistSwipeSession(updatedSession)

  const nextStartingPlayer = updatedSession.players[nextStartingPlayerIndex]
  if (nextStartingPlayer) {
    triggerRoundAdvancePulse(nextStartingPlayer.id)
  }
}

function endGameEarly() {
  if (!activeSession.value || !canEndGameEarly.value) {
    return
  }

  const finalRoundScores = {
    ...activeSession.value.scoresByRound[SWIPE_TOTAL_ROUNDS],
  }

  for (const player of activeSession.value.players) {
    if (typeof finalRoundScores[player.id] !== 'number') {
      finalRoundScores[player.id] = 0
    }
  }

  const updatedSession: SwipeSessionEnvelope = {
    ...activeSession.value,
    endedEarlyRound: activeRound.value,
    currentRound: SWIPE_TOTAL_ROUNDS,
    scoresByRound: {
      ...activeSession.value.scoresByRound,
      [SWIPE_TOTAL_ROUNDS]: finalRoundScores,
    },
    isGameLocked: true,
    updatedAt: Date.now(),
  }

  persistSwipeSession(updatedSession)
}

function continueGameAfterEarlyEnd() {
  if (!activeSession.value || !canContinueGame.value || endedEarlyRound.value === null) {
    return
  }

  const updatedSession: SwipeSessionEnvelope = {
    ...activeSession.value,
    currentRound: endedEarlyRound.value,
    isGameLocked: false,
    endedEarlyRound: null,
    updatedAt: Date.now(),
  }

  persistSwipeSession(updatedSession)
}

function applyWinnerAutofill(playerId: string) {
  if (!activeSession.value || isTrackerReadOnly.value) {
    return
  }

  const currentRound = activeRound.value
  const nextWinnerValue = winnerAutofillValue.value
  const existingRoundScores = { ...activeSession.value.scoresByRound[currentRound] }

  for (const player of activeSession.value.players) {
    if (existingRoundScores[player.id] === nextWinnerValue) {
      existingRoundScores[player.id] = null
    }
  }

  existingRoundScores[playerId] = nextWinnerValue

  const updatedSession: SwipeSessionEnvelope = {
    ...activeSession.value,
    scoresByRound: {
      ...activeSession.value.scoresByRound,
      [currentRound]: existingRoundScores,
    },
    updatedAt: Date.now(),
  }

  persistSwipeSession(updatedSession)
}

function setGameLockState(isLocked: boolean) {
  if (!activeSession.value || isArchivedReadOnly.value) {
    return
  }

  const updatedSession: SwipeSessionEnvelope = {
    ...activeSession.value,
    isGameLocked: isLocked,
    updatedAt: Date.now(),
  }

  persistSwipeSession(updatedSession)
}

function persistSwipeSession(session: SwipeSessionEnvelope) {
  saveSession(session)
  activeSession.value = session
  refreshStoredSessions()
}

function getScoreInputValue(round: number, playerId: string): string {
  const value = activeSession.value?.scoresByRound[round]?.[playerId]
  return typeof value === 'number' ? String(value) : ''
}

function updateRoundScore(round: number, playerId: string, rawValue: string) {
  if (!activeSession.value || isTrackerReadOnly.value) {
    return
  }

  const trimmedValue = rawValue.trim()
  let nextScore: number | null = null

  if (trimmedValue.length > 0) {
    const parsed = Number(trimmedValue)
    if (Number.isFinite(parsed)) {
      nextScore = normalizeSwipeScore(parsed)
    }
  }

  const roundScores = {
    ...activeSession.value.scoresByRound[round],
    [playerId]: nextScore,
  }

  const updatedSession: SwipeSessionEnvelope = {
    ...activeSession.value,
    scoresByRound: {
      ...activeSession.value.scoresByRound,
      [round]: roundScores,
    },
    updatedAt: Date.now(),
  }

  persistSwipeSession(updatedSession)
}

function showSessionChooser() {
  initializeSessionChooser()
}

function openSettingsPanel() {
  settingsPanelState.value = 'showing'
}

function closeSettingsPanel() {
  settingsPanelState.value = 'hidden'
}

function onRetentionDaysChange(days: number) {
  retentionDays.value = setSessionRetentionDays(days)
}

watch(tooltipsEnabled, (value) => {
  setTooltipsEnabled(value)
})

watch(isGameComplete, (gameComplete, wasGameComplete) => {
  if (
    gameComplete &&
    !wasGameComplete &&
    activeSession.value &&
    !isArchivedReadOnly.value &&
    !activeSession.value.isGameLocked
  ) {
    setGameLockState(true)
  }
})

onMounted(() => {
  initializeSessionChooser()
  retentionDays.value = getSessionRetentionDays()
  tooltipsEnabled.value = getTooltipsEnabled()
})

onBeforeUnmount(() => {
  clearRoundAdvancePulseTimer()
  destroy()
})

function clearAllStoredSessions() {
  const wasDeleted = clearAllSessions()
  if (wasDeleted) {
    setupPlayerCount.value = SWIPE_MIN_PLAYERS
  }
}
</script>

<template>
  <main class="swipe-page" :class="{ 'swipe-page--entry-transition': isEntryTransitionRunning }">
    <header class="swipe-header">
      <div class="header-top-row">
        <p class="eyebrow">Score Tracker</p>
        <div class="session-controls">
          <button
            v-if="sessionChooserState === 'hidden'"
            type="button"
            class="back-to-chooser"
            aria-label="Back to sessions"
            data-test="back-to-chooser-button"
            @click="showSessionChooser"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M12 3.2L3 10.5h2v9.3h5.6v-5.7h2.8v5.7H19v-9.3h2L12 3.2z"
                fill="currentColor"
              />
            </svg>
          </button>
          <button
            type="button"
            class="settings-button"
            aria-label="Open settings"
            data-test="settings-button"
            @click="openSettingsPanel"
          >
            ⚙
          </button>
        </div>
      </div>

      <div class="header-content">
        <div ref="headerLogoRef" class="header-logo">
          <img :src="swipeLogoUrl" alt="Swipe Score Tracker" />
        </div>
        <div class="header-text">
          <h1>Swipe</h1>
          <p class="intro">Scoring has never been simpler!</p>
        </div>
      </div>

      <p v-if="isArchivedReadOnly && sessionChooserState === 'hidden'" class="readonly-badge">
        Archived Session (Read-Only)
      </p>
    </header>

    <SwipeSettingsModal
      :is-showing="settingsPanelState === 'showing'"
      :retention-days="retentionDays"
      :tooltips-enabled="tooltipsEnabled"
      @close="closeSettingsPanel"
      @update-retention="onRetentionDaysChange"
      @update-tooltips="(value) => (tooltipsEnabled = value)"
    />

    <div
      class="session-shell"
      :class="{ 'session-shell--transitioning': isEntryTransitionRunning }"
    >
      <CanastaSessionSelector
        v-if="shouldRenderChooserContent"
        :current-session-option="currentSessionOption"
        :previous-session-options="previousSessionOptions"
        :all-stored-sessions="allStoredSessions"
        :retention-days="retentionDays"
        :is-transitioning="isEntryTransitionRunning"
        @new-session="createNewSession"
        @load-current-session="loadCurrentSession"
        @load-previous-session="loadPreviousSession"
        @delete-all-sessions="clearAllStoredSessions"
      />

      <section
        v-if="shouldRenderSessionContent"
        class="session-active-view"
        data-test="swipe-session-shell"
        :aria-hidden="sessionChooserState === 'showing' && !isEntryTransitionRunning"
      >
        <section v-if="isSetupShell" class="setup-shell" data-test="swipe-setup-shell">
          <header class="setup-shell-header">
            <h2>Swipe Setup</h2>
            <p>
              Set player order clockwise from the starting player. Add at least
              {{ SWIPE_MIN_PLAYERS }} named players.
            </p>
          </header>

          <div class="setup-controls">
            <label class="setup-field" for="swipe-player-count">
              <span>Players</span>
              <div class="player-count-control">
                <button
                  type="button"
                  class="count-button"
                  data-test="swipe-player-count-decrement"
                  :disabled="setupPlayerCount <= SWIPE_MIN_PLAYERS"
                  @click="setSetupPlayerCount(setupPlayerCount - 1)"
                >
                  -
                </button>
                <input
                  id="swipe-player-count"
                  data-test="swipe-player-count-input"
                  type="number"
                  inputmode="numeric"
                  :min="SWIPE_MIN_PLAYERS"
                  :max="SWIPE_MAX_PLAYERS"
                  :value="setupPlayerCount"
                  @change="setSetupPlayerCount(Number(($event.target as HTMLInputElement).value))"
                />
                <button
                  type="button"
                  class="count-button"
                  data-test="swipe-player-count-increment"
                  :disabled="setupPlayerCount >= SWIPE_MAX_PLAYERS"
                  @click="setSetupPlayerCount(setupPlayerCount + 1)"
                >
                  +
                </button>
              </div>
            </label>

            <fieldset class="setup-field winner-mode-field">
              <legend>Winner Value</legend>
              Choose the amount of points that the winning player receives per round.
              <label>
                <input
                  data-test="swipe-winner-mode-zero"
                  type="radio"
                  name="swipe-winner-mode"
                  value="zero"
                  :checked="activeSession?.winnerValueMode === 'zero'"
                  @change="updateWinnerMode('zero')"
                />
                Winner gets 0
              </label>
              <label>
                <input
                  data-test="swipe-winner-mode-minus-ten"
                  type="radio"
                  name="swipe-winner-mode"
                  value="minusTen"
                  :checked="activeSession?.winnerValueMode === 'minusTen'"
                  @change="updateWinnerMode('minusTen')"
                />
                Winner gets -10
              </label>
            </fieldset>
          </div>

          <ol class="player-setup-list" data-test="swipe-player-setup-list">
            <li v-for="(player, index) in activeSession?.players ?? []" :key="player.id">
              <label :for="`swipe-player-${player.id}`">
                <span>
                  {{ index === 0 ? 'Starts first' : `Seat ${index + 1}` }}
                </span>
                <input
                  :id="`swipe-player-${player.id}`"
                  :data-test="`swipe-player-name-${index + 1}`"
                  type="text"
                  autocomplete="off"
                  autocapitalize="words"
                  maxlength="20"
                  :value="player.name"
                  :placeholder="`Player ${index + 1}`"
                  @input="
                    updateSetupPlayerName(player.id, ($event.target as HTMLInputElement).value)
                  "
                />
              </label>
            </li>
          </ol>

          <div class="setup-actions">
            <button
              type="button"
              class="setup-start-button"
              data-test="swipe-start-tracker-button"
              :disabled="!canStartTracker"
              @click="beginTrackerFromSetup"
            >
              Start Tracker
            </button>
          </div>
        </section>

        <section v-else-if="isTrackerShell" class="tracker-shell" data-test="swipe-tracker-shell">
          <div class="tracker-shell-header">
            <h2>Swipe Tracker</h2>
            <p>Enter up to 12 rounds or stop whenever you like.</p>
          </div>

          <div class="round-progress-controls" data-test="swipe-round-progress">
            <div class="round-badge" data-test="swipe-round-badge">
              Round {{ activeRound }} / {{ SWIPE_TOTAL_ROUNDS }}
            </div>
          </div>

          <div class="winner-chip-bar" data-test="swipe-winner-chip-bar">
            <p class="winner-chip-label">Winner quick fill ({{ winnerAutofillValue }})</p>
            <div class="winner-chip-list">
              <button
                v-for="(player, index) in trackerPlayerPreview"
                :key="`winner-chip-${player.id}`"
                type="button"
                class="winner-chip"
                :class="{
                  'winner-chip--active':
                    getScoreInputValue(activeRound, player.id) === String(winnerAutofillValue),
                }"
                :data-test="`swipe-winner-chip-p${index + 1}`"
                :title="`Set ${player.fullName} round ${activeRound} to ${winnerAutofillValue}`"
                :disabled="isTrackerReadOnly"
                @click="applyWinnerAutofill(player.id)"
              >
                {{ player.shortName }}
              </button>
            </div>
          </div>

          <div
            v-if="isGameComplete"
            class="game-complete-summary"
            data-test="swipe-game-complete-summary"
          >
            <span>{{ winnerSummaryText }}</span>
          </div>

          <div v-if="trackerStatusLabel" class="round-status" data-test="swipe-round-status">
            {{ trackerStatusLabel }}
          </div>

          <section class="score-grid-shell" data-test="swipe-score-grid">
            <div class="score-grid-table">
              <div class="score-grid-head">
                <div class="score-grid-player-header">Player</div>
                <div class="score-grid-rounds-header" aria-hidden="true">
                  <span
                    v-for="round in roundNumbers"
                    :key="`header-r${round}`"
                    class="score-grid-round-header"
                    :class="{ 'score-grid-round-header--active': round === activeRound }"
                  >
                    R{{ round }}
                  </span>
                </div>
                <div class="score-grid-total-header">Total</div>
              </div>

              <div
                v-for="(player, index) in trackerPlayerPreview"
                :key="`row-${player.id}`"
                :data-test="`swipe-score-row-p${index + 1}`"
                class="score-grid-row"
                :class="{
                  'score-grid-row--starting': index === activeSession?.currentStartingPlayerIndex,
                  'score-grid-row--pulse': player.id === roundAdvancePulsePlayerId,
                  'score-grid-row--winner': isGameComplete && winnerPlayerIds.includes(player.id),
                }"
              >
                <div class="score-grid-player-cell" :title="player.fullName">
                  <span>{{ player.shortName }}</span>
                </div>

                <div class="score-grid-rounds-scroll">
                  <label
                    v-for="round in roundNumbers"
                    :key="`${player.id}-r${round}`"
                    class="score-input-wrap"
                    :class="{
                      'score-input-wrap--active': round === activeRound,
                      'score-input-wrap--active-last':
                        round === activeRound && index === trackerPlayerPreview.length - 1,
                    }"
                    :aria-label="`${player.fullName} round ${round}`"
                  >
                    <span class="sr-only">{{ player.fullName }} round {{ round }}</span>
                    <input
                      :data-test="`swipe-score-input-r${round}-p${index + 1}`"
                      type="number"
                      inputmode="numeric"
                      :min="SWIPE_SCORE_MIN"
                      :max="SWIPE_SCORE_MAX"
                      :value="getScoreInputValue(round, player.id)"
                      :disabled="isTrackerReadOnly"
                      @change="
                        updateRoundScore(
                          round,
                          player.id,
                          ($event.target as HTMLInputElement).value,
                        )
                      "
                    />
                  </label>
                </div>

                <div
                  class="score-grid-total-cell"
                  :class="{
                    'score-grid-total-cell--winner':
                      isGameComplete && winnerPlayerIds.includes(player.id),
                  }"
                  :data-test="`swipe-running-total-p${index + 1}`"
                  :title="`Running total for ${player.fullName}`"
                >
                  {{ runningTotalsByPlayer[player.id] ?? 0 }}
                </div>
              </div>
            </div>
          </section>

          <div
            v-if="!isGameComplete"
            class="round-bottom-actions"
            data-test="swipe-round-bottom-actions"
          >
            <button
              type="button"
              class="next-round-button"
              data-test="swipe-next-round-button"
              :disabled="!canAdvanceRound"
              @click="advanceToNextRound"
            >
              Next Round
            </button>
            <button
              type="button"
              class="end-game-button"
              data-test="swipe-end-game-button"
              :disabled="!canEndGameEarly"
              @click="endGameEarly"
            >
              End Game
            </button>
          </div>

          <div v-if="isGameComplete" class="post-game-actions" data-test="swipe-post-game-actions">
            <button
              type="button"
              class="continue-game-button post-game-action-button"
              data-test="swipe-continue-game-button"
              :disabled="!canContinueGame"
              @click="continueGameAfterEarlyEnd"
            >
              Continue Game
            </button>
            <button
              type="button"
              class="leave-game-button post-game-action-button"
              data-test="swipe-leave-button"
              @click="showSessionChooser"
            >
              Leave
            </button>
          </div>
        </section>
      </section>
    </div>

    <div
      v-if="isEntryTransitionRunning"
      class="session-logo-overlay"
      :style="logoOverlayStyle"
      aria-hidden="true"
    >
      <img :src="swipeLogoUrl" alt="" />
    </div>
  </main>
</template>

<style scoped>
.swipe-page {
  display: grid;
  gap: 1rem;
  width: 100%;
  max-width: none;
}

.swipe-header {
  border: 1px solid var(--ui-border);
  border-radius: 18px;
  padding: 1rem;
  background: linear-gradient(140deg, rgba(240, 250, 240, 0.9), rgba(255, 255, 255, 0.9));
  box-shadow: 0 8px 32px rgba(26, 41, 52, 0.08);
}

.swipe-page--entry-transition {
  pointer-events: none;
}

.header-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.header-text {
  flex: 1;
}

.header-logo {
  flex-shrink: 0;
  width: 100px;
  height: 100px;
}

.header-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.swipe-page--entry-transition .header-logo {
  opacity: 0;
}

.header-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ui-muted);
  font-weight: 700;
  margin-bottom: 0.25rem;
}

h1 {
  font-size: clamp(1.7rem, 3.2vw, 2.4rem);
  margin-bottom: 0.5rem;
}

.intro {
  max-width: 65ch;
  color: var(--ui-muted);
}

.readonly-badge {
  margin: 0.5rem 0 0;
  display: inline-block;
  background: #f8f1da;
  border: 1px solid #dccb8d;
  color: #695118;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 700;
}

.session-shell {
  position: relative;
  display: grid;
  gap: 1rem;
}

.session-active-view {
  display: grid;
  min-height: 180px;
}

.setup-shell,
.tracker-shell {
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  padding: 1rem;
  background: var(--ui-card);
  display: grid;
  gap: 1rem;
}

.setup-shell-header h2,
.tracker-shell-header h2 {
  margin: 0;
}

.setup-shell-header p,
.tracker-shell-header p {
  margin: 0.35rem 0 0;
  color: var(--ui-muted);
}

.setup-controls {
  display: grid;
  gap: 0.8rem;
}

.setup-field {
  display: grid;
  gap: 0.35rem;
  margin: 0;
}

.setup-field > span,
.winner-mode-field legend {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
  color: var(--ui-muted);
}

.player-count-control {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.count-button {
  min-width: 2rem;
  min-height: 2rem;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: #fff;
  font-weight: 700;
}

.player-count-control input {
  width: 3.2rem;
  height: 2rem;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  text-align: center;
  font-weight: 700;
}

.winner-mode-field {
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
  display: grid;
  gap: 0.4rem;
}

.winner-mode-field label {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.9rem;
}

.player-setup-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.65rem;
}

.player-setup-list li label {
  display: grid;
  gap: 0.35rem;
}

.player-setup-list li span {
  font-size: 0.8rem;
  color: var(--ui-muted);
  font-weight: 600;
}

.player-setup-list li input {
  min-height: 2.3rem;
  border: 1px solid var(--ui-border);
  border-radius: 9px;
  padding: 0.45rem 0.55rem;
  font-size: 0.95rem;
}

.setup-actions {
  display: flex;
}

.setup-start-button {
  width: 100%;
  min-height: 2.4rem;
  border: 1px solid #7eb4d4;
  border-radius: 10px;
  background: linear-gradient(140deg, rgba(221, 239, 249, 0.95), rgba(240, 249, 255, 0.95));
  color: #18334c;
  font-weight: 700;
}

.setup-start-button:disabled {
  opacity: 0.55;
}

.round-progress-controls {
  display: inline-flex;
  gap: 0.45rem;
  align-items: center;
}

.round-badge {
  border: 1px solid #7eb4d4;
  background: #edf7ff;
  color: #255777;
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.round-status {
  width: 100%;
  font-size: 0.78rem;
  color: #255a2a;
  font-weight: 700;
  text-align: center;
}

.round-bottom-actions {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-self: center;
  gap: 0.45rem;
}

.end-game-button {
  width: fit-content;
  white-space: nowrap;
  border: 1px solid #d39a7e;
  background: linear-gradient(140deg, rgba(255, 237, 226, 0.95), rgba(255, 245, 236, 0.95));
  color: #5f321c;
  border-radius: 9px;
  min-height: 2rem;
  padding: 0 1.95rem;
  font-size: 0.78rem;
  font-weight: 700;
}

.end-game-button:disabled {
  opacity: 0.55;
}

.next-round-button {
  width: fit-content;
  white-space: nowrap;
  border: 1px solid #7eb4d4;
  background: linear-gradient(140deg, rgba(221, 239, 249, 0.95), rgba(240, 249, 255, 0.95));
  color: #18334c;
  border-radius: 9px;
  min-height: 2rem;
  padding: 0 1.95rem;
  font-size: 0.78rem;
  font-weight: 700;
}

.next-round-button:disabled {
  opacity: 0.55;
}

.winner-chip-bar {
  display: grid;
  gap: 0.45rem;
}

.winner-chip-label {
  margin: 0;
  font-size: 0.76rem;
  color: var(--ui-muted);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.winner-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.winner-chip {
  min-height: 1.95rem;
  border: 1px solid #c7d6e4;
  background: #f8fcff;
  color: #23445f;
  border-radius: 999px;
  padding: 0 0.62rem;
  font-size: 0.75rem;
  font-weight: 700;
}

.winner-chip--active {
  border-color: #60a4d0;
  background: #e7f4ff;
  color: #1c4f74;
}

.winner-chip:disabled {
  opacity: 0.6;
}

.game-complete-summary {
  border: 1px solid #9ecb9f;
  background: #eef9ef;
  color: #255a2a;
  border-radius: 10px;
  min-height: 2.2rem;
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.65rem;
  font-size: 0.86rem;
  font-weight: 700;
  text-align: center;
}

.post-game-actions {
  display: flex;
  justify-content: center;
  gap: 0.55rem;
}

.post-game-action-button {
  width: fit-content;
  white-space: nowrap;
  border: 1px solid #7eb4d4;
  background: linear-gradient(140deg, rgba(221, 239, 249, 0.95), rgba(240, 249, 255, 0.95));
  color: #18334c;
  border-radius: 9px;
  min-height: 2rem;
  padding: 0 1.95rem;
  font-size: 0.78rem;
  font-weight: 700;
}

.post-game-action-button:disabled {
  opacity: 0.55;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.score-grid-shell {
  --score-round-col-width: 3.25rem;
  --score-round-count: 12;
  border: 1px solid var(--ui-border);
  border-radius: 12px;
  overflow-x: auto;
  overflow-y: hidden;
}

.score-grid-table {
  min-width: max-content;
}

.score-grid-head,
.score-grid-row {
  display: grid;
  grid-template-columns: 4.6rem calc(var(--score-round-col-width) * var(--score-round-count)) 4.8rem;
  align-items: stretch;
}

.score-grid-head {
  border-bottom: 1px solid var(--ui-border);
  background: #f5f9fd;
}

.score-grid-player-header,
.score-grid-total-header {
  position: sticky;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #4b6072;
}

.score-grid-player-header {
  left: 0;
  border-right: 1px solid #d7e1ea;
  background: #f0f6fb;
}

.score-grid-total-header {
  right: 0;
  border-left: 1px solid #d7e1ea;
  background: #f0f6fb;
}

.score-grid-rounds-header {
  display: inline-flex;
  align-items: center;
}

.score-grid-round-header {
  min-width: var(--score-round-col-width);
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border-right: 1px solid #e5edf4;
  font-size: 0.73rem;
  font-weight: 700;
  color: #5a6f82;
  min-height: 2rem;
}

.score-grid-round-header--active {
  border-left: 3px solid #3f8fc0;
  border-right: 3px solid #3f8fc0;
  border-top: 3px solid #3f8fc0;
  background: #f0f8fe;
  color: #1e4d6d;
  font-weight: 800;
}

.score-grid-row {
  border-bottom: 1px solid #e3ebf2;
}

.score-grid-row:last-child {
  border-bottom: none;
}

.score-grid-row--starting .score-grid-player-cell {
  border-left: 3px solid #3f8fc0;
  font-weight: 800;
  background: #eef8ff;
}

.score-grid-row--pulse .score-grid-player-cell {
  animation: starterPulse 900ms ease;
}

.score-grid-row--winner .score-grid-player-cell {
  background: #ecf8ec;
  border-left: 3px solid #5ea160;
}

.score-grid-player-cell,
.score-grid-total-cell {
  position: sticky;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.35rem;
  font-size: 0.83rem;
}

.score-grid-player-cell {
  left: 0;
  border-right: 1px solid #dce6ef;
  background: #fbfdff;
  box-shadow: 6px 0 8px -8px rgba(35, 62, 87, 0.32);
}

.score-grid-player-cell span {
  display: inline-block;
}

.score-grid-total-cell {
  right: 0;
  border-left: 1px solid #dce6ef;
  background: #fbfdff;
  font-weight: 700;
  box-shadow: -6px 0 8px -8px rgba(35, 62, 87, 0.32);
}

.score-grid-total-cell--winner {
  background: #e4f4e4;
  color: #1d4f22;
}

.score-grid-rounds-scroll {
  display: inline-flex;
}

.score-input-wrap {
  min-width: var(--score-round-col-width);
  border-right: 1px solid #edf3f8;
  border-top: none;
  border-bottom: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.score-input-wrap--active {
  border-left: 3px solid #3f8fc0;
  border-right: 3px solid #3f8fc0;
  background: #f7fbff;
}

.score-input-wrap--active-last {
  border-bottom: 3px solid #3f8fc0;
}

.score-input-wrap input {
  width: 2.8rem;
  min-height: 2.05rem;
  border: 1px solid #d2dce6;
  border-radius: 7px;
  text-align: center;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1f3347;
  background: #fff;
}

.score-input-wrap input::-webkit-outer-spin-button,
.score-input-wrap input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.score-input-wrap input[type='number'] {
  appearance: textfield;
}

.session-shell--transitioning > .session-chooser,
.session-shell--transitioning > .session-active-view {
  grid-area: 1 / 1;
}

.session-shell--transitioning > .session-chooser {
  animation: sessionChooserFadeOut 850ms ease forwards;
}

.session-shell--transitioning > .session-active-view {
  opacity: 0;
  animation: sessionActiveFadeIn 800ms ease 700ms forwards;
}

.session-controls {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.back-to-chooser,
.settings-button {
  min-width: 2.2rem;
  min-height: 2.2rem;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--ui-card);
  color: var(--ui-text);
}

.back-to-chooser svg {
  width: 1.1rem;
  height: 1.1rem;
}

.settings-button {
  font-size: 1rem;
}

.session-logo-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
  display: grid;
  place-items: center;
}

.session-logo-overlay img {
  width: var(--entry-logo-target-size);
  height: var(--entry-logo-target-size);
  object-fit: contain;
  transform: translate(var(--entry-logo-start-x), var(--entry-logo-start-y))
    scale(var(--entry-logo-start-scale));
  animation: logoFlight var(--entry-transition-duration) ease forwards;
}

@keyframes sessionChooserFadeOut {
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

@keyframes sessionActiveFadeIn {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

@keyframes logoFlight {
  0% {
    transform: translate(var(--entry-logo-start-x), var(--entry-logo-start-y))
      scale(var(--entry-logo-start-scale));
    opacity: 1;
  }

  100% {
    transform: translate(var(--entry-logo-end-x), var(--entry-logo-end-y))
      scale(var(--entry-logo-end-scale));
    opacity: 0;
  }
}

@keyframes starterPulse {
  0% {
    background: #dbf3ff;
  }

  45% {
    background: #b8e6ff;
  }

  100% {
    background: #eef8ff;
  }
}

@media (max-width: 720px) {
  .setup-shell,
  .tracker-shell {
    padding: 0.85rem;
  }

  .session-active-view {
    min-height: 140px;
  }

  .score-grid-shell {
    --score-round-col-width: 3rem;
  }

  .score-grid-head,
  .score-grid-row {
    grid-template-columns: 4rem calc(var(--score-round-col-width) * var(--score-round-count)) 4.2rem;
  }

  .score-input-wrap input {
    width: 2.5rem;
  }
}

@media (max-width: 480px) {
  .setup-shell,
  .tracker-shell {
    padding: 0.75rem;
  }

  .score-grid-shell {
    --score-round-col-width: 2.75rem;
  }

  .score-grid-head,
  .score-grid-row {
    grid-template-columns:
      3.65rem calc(var(--score-round-col-width) * var(--score-round-count))
      3.95rem;
  }

  .score-grid-player-header,
  .score-grid-total-header,
  .score-grid-player-cell,
  .score-grid-total-cell {
    font-size: 0.75rem;
  }

  .post-game-actions {
    flex-wrap: wrap;
  }

  .next-round-button,
  .end-game-button,
  .post-game-action-button {
    padding: 0 1.2rem;
  }
}
</style>
