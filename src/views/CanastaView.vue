<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import confetti from 'canvas-confetti'

import canastaLogoUrl from '@/assets/CanastaLogo.png'
import CanastaHandForm from '@/components/canasta/CanastaHandForm.vue'
import {
  getCurrentSession,
  getPreviousSessions,
  sortSessionsByNewest,
  isSessionEmpty,
  formatSessionLabel,
} from '@/services/canasta/sessionHelpers'
import { scoreCanastaHand } from '@/services/canasta/scoring'
import {
  deleteAllSessions,
  deleteSession,
  loadAllSessions,
  pruneExpiredSessions,
  saveSession,
  getSessionRetentionDays,
  setSessionRetentionDays,
  getTooltipsEnabled,
  setTooltipsEnabled,
} from '@/services/canasta/sessionStorage'
import {
  createEmptyCanastaSessionEnvelope,
  createEmptyCanastaHandInputs,
  type CanastaHandInputs,
  type CanastaSessionEnvelope,
  type CanastaSessionType,
  type CanastaTabId,
  type CanastaTeamId,
  type HandTabId,
} from '@/types/canasta'

interface HandTabMeta {
  id: HandTabId
  label: string
}

interface TeamMeta {
  id: CanastaTeamId
  label: string
}

const HAND_TABS: HandTabMeta[] = [
  { id: 'hand1', label: '1' },
  { id: 'hand2', label: '2' },
  { id: 'hand3', label: '3' },
  { id: 'hand4', label: '4' },
]

const TOTALS_TAB: { id: CanastaTabId; label: string } = { id: 'totals', label: 'Totals' }

const TEAMS: TeamMeta[] = [
  { id: 'teamA', label: 'We' },
  { id: 'teamB', label: 'Them' },
]

const SESSION_TYPE_OPTIONS: Array<{ id: CanastaSessionType; label: string }> = [
  { id: 'myTeamOnly', label: "My Team Full Scoring + Opponent's Totals" },
  { id: 'bothTeams', label: 'Both Teams Full Scoring' },
  { id: 'totalScoresOnly', label: 'Both Teams Totals Only' },
]

function createDefaultHandState(): Record<HandTabId, Record<CanastaTeamId, CanastaHandInputs>> {
  return HAND_TABS.reduce(
    (accumulator, tab) => {
      accumulator[tab.id] = {
        teamA: createEmptyCanastaHandInputs(),
        teamB: createEmptyCanastaHandInputs(),
      }
      return accumulator
    },
    {} as Record<HandTabId, Record<CanastaTeamId, CanastaHandInputs>>,
  )
}

function cloneHandState(
  source: Record<HandTabId, Record<CanastaTeamId, CanastaHandInputs>>,
): Record<HandTabId, Record<CanastaTeamId, CanastaHandInputs>> {
  return JSON.parse(JSON.stringify(source)) as Record<
    HandTabId,
    Record<CanastaTeamId, CanastaHandInputs>
  >
}

const activeTab = ref<CanastaTabId>('hand1')
const confettiPlayed = ref(false)
const sessionChooserState = ref<'showing' | 'hidden'>('showing')
const sessionTypeModalState = ref<'showing' | 'hidden'>('hidden')
const settingsPanelState = ref<'showing' | 'hidden'>('hidden')
const retentionDays = ref<number>(90)
const tooltipsEnabled = ref<boolean>(true)
const selectedSessionType = ref<CanastaSessionType>('bothTeams')
const selectedPreviousSessionId = ref('')
const isArchivedReadOnly = ref(false)
const allStoredSessions = ref<CanastaSessionEnvelope[]>([])
const activeSession = ref<CanastaSessionEnvelope | null>(null)

const handState =
  ref<Record<HandTabId, Record<CanastaTeamId, CanastaHandInputs>>>(createDefaultHandState())

const currentSessionOption = computed(() => getCurrentSession(allStoredSessions.value))
const previousSessionOptions = computed(() => getPreviousSessions(allStoredSessions.value))
const currentSessionType = computed<CanastaSessionType>(() => {
  return activeSession.value?.sessionType ?? 'bothTeams'
})
const activeSessionTypeLabel = computed(() => {
  const sessionType = activeSession.value?.sessionType
  return SESSION_TYPE_OPTIONS.find((option) => option.id === sessionType)?.label ?? ''
})

function refreshStoredSessions() {
  allStoredSessions.value = sortSessionsByNewest(loadAllSessions())
}

function hydrateFromSession(session: CanastaSessionEnvelope, readOnly = false) {
  activeSession.value = session
  activeTab.value = session.activeTab
  handState.value = cloneHandState(session.handState)
  isArchivedReadOnly.value = readOnly
  confettiPlayed.value = false
  sessionChooserState.value = 'hidden'
}

function initializeSessionChooser() {
  pruneExpiredSessions()
  for (const session of loadAllSessions()) {
    if (isSessionEmpty(session)) {
      deleteSession(session.sessionId)
    }
  }
  refreshStoredSessions()
  sessionChooserState.value = 'showing'
  sessionTypeModalState.value = 'hidden'
  selectedPreviousSessionId.value = ''
  isArchivedReadOnly.value = false
}

onMounted(() => {
  initializeSessionChooser()
  retentionDays.value = getSessionRetentionDays()
  tooltipsEnabled.value = getTooltipsEnabled()
})

const activeHandTab = computed<HandTabId | null>(() => {
  return activeTab.value === 'totals' ? null : activeTab.value
})

const totalsByHand = computed(() => {
  const result = {} as Record<HandTabId, Record<CanastaTeamId, ReturnType<typeof scoreCanastaHand>>>

  for (const tab of HAND_TABS) {
    result[tab.id] = {
      teamA: scoreCanastaHand(handState.value[tab.id].teamA),
      teamB: scoreCanastaHand(handState.value[tab.id].teamB),
    }
  }

  return result
})

const totalsByTeam = computed(() => {
  const result: Record<CanastaTeamId, number> = { teamA: 0, teamB: 0 }

  for (const tab of HAND_TABS) {
    result.teamA += totalsByHand.value[tab.id].teamA.total
    result.teamB += totalsByHand.value[tab.id].teamB.total
  }

  return result
})

const leaderTeamId = computed<CanastaTeamId | null>(() => {
  if (totalsByTeam.value.teamA === totalsByTeam.value.teamB) {
    return null
  }

  return totalsByTeam.value.teamA > totalsByTeam.value.teamB ? 'teamA' : 'teamB'
})

const leadAmount = computed(() => {
  return Math.abs(totalsByTeam.value.teamA - totalsByTeam.value.teamB)
})

const hasAnyScores = computed(() => {
  return totalsByTeam.value.teamA !== 0 || totalsByTeam.value.teamB !== 0
})

const leaderSummary = computed(() => {
  if (!hasAnyScores.value) {
    return 'Enter scores to see the leader.'
  }

  if (!leaderTeamId.value) {
    return 'Tie game'
  }

  const leader = TEAMS.find((team) => team.id === leaderTeamId.value)

  if (isGameComplete.value) {
    return `Congrats! ${leader?.label ?? 'Team'} Won!`
  }

  const leadPhrase = leaderTeamId.value === 'teamA' ? "We're leading by" : "They're leading by"
  return `${leadPhrase} ${formatNumber(leadAmount.value)}`
})

const isGameComplete = computed(() => {
  if (!leaderTeamId.value) {
    return false
  }

  for (const tab of HAND_TABS) {
    const teamATotal = totalsByHand.value[tab.id].teamA.total
    const teamBTotal = totalsByHand.value[tab.id].teamB.total

    if (teamATotal === 0 || teamBTotal === 0) {
      return false
    }
  }

  return true
})

function fireConfetti() {
  const count = 200
  const defaults = {
    origin: { y: 0.7 },
  }

  function fire(particleRatio: number, opts: any) {
    ;(confetti as any)(
      Object.assign({}, defaults, opts, {
        particleCount: Math.floor(count * particleRatio),
      }),
    )
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  })

  fire(0.2, {
    spread: 60,
  })

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  })
}

watch(
  () => ({ isComplete: isGameComplete.value, activeTab: activeTab.value }),
  ({ isComplete, activeTab: currentTab }) => {
    if (isComplete && !confettiPlayed.value && currentTab === 'totals') {
      confettiPlayed.value = true
      fireConfetti()
    }
  },
)

function setActiveTab(tabId: CanastaTabId) {
  activeTab.value = tabId
  if (!activeSession.value || isArchivedReadOnly.value) {
    return
  }

  activeSession.value = {
    ...activeSession.value,
    activeTab: tabId,
    handState: cloneHandState(handState.value),
    updatedAt: Date.now(),
  }
  saveSession(activeSession.value)
  refreshStoredSessions()
}

function updateTeamInputs(handId: HandTabId, teamId: CanastaTeamId, nextValue: CanastaHandInputs) {
  if (isArchivedReadOnly.value) {
    return
  }

  handState.value[handId][teamId] = nextValue
}

function persistHandState() {
  if (!activeSession.value || isArchivedReadOnly.value) {
    return
  }

  activeSession.value = {
    ...activeSession.value,
    activeTab: activeTab.value,
    handState: cloneHandState(handState.value),
    updatedAt: Date.now(),
  }
  saveSession(activeSession.value)
  refreshStoredSessions()
}

function isWentOutDisabled(handId: HandTabId, teamId: CanastaTeamId): boolean {
  const opposingTeamId: CanastaTeamId = teamId === 'teamA' ? 'teamB' : 'teamA'
  return handState.value[handId][opposingTeamId].wentOut
}

function isLeader(teamId: CanastaTeamId): boolean {
  return leaderTeamId.value === teamId
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

function openNewSessionModal() {
  selectedSessionType.value = 'bothTeams'
  sessionTypeModalState.value = 'showing'
}

function closeNewSessionModal() {
  sessionTypeModalState.value = 'hidden'
}

function createNewSession() {
  const newSession = createEmptyCanastaSessionEnvelope(selectedSessionType.value)
  saveSession(newSession)
  refreshStoredSessions()
  hydrateFromSession(newSession)
  closeNewSessionModal()
}

function loadCurrentSession() {
  if (!currentSessionOption.value) {
    return
  }

  hydrateFromSession(currentSessionOption.value)
}

function loadPreviousSession() {
  const sessionId = Number(selectedPreviousSessionId.value)
  if (!Number.isFinite(sessionId) || sessionId <= 0) {
    return
  }

  const selectedSession = previousSessionOptions.value.find(
    (session) => session.sessionId === sessionId,
  )
  if (!selectedSession) {
    return
  }

  hydrateFromSession(selectedSession, true)
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

function clearAllStoredSessions() {
  const shouldDelete =
    typeof window.confirm === 'function'
      ? window.confirm('Delete all stored Canasta sessions?')
      : true
  if (!shouldDelete) {
    return
  }

  deleteAllSessions()
  activeSession.value = null
  activeTab.value = 'hand1'
  handState.value = createDefaultHandState()
  initializeSessionChooser()
}
</script>

<template>
  <main class="canasta-page">
    <header class="canasta-header">
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
        <div class="header-logo">
          <img :src="canastaLogoUrl" alt="Canasta Score Tracker" />
        </div>
        <div class="header-text">
          <h1>Canasta</h1>
          <p class="intro">Scoring has never been simpler!</p>
        </div>
      </div>

      <p v-if="activeSessionTypeLabel && sessionChooserState === 'hidden'" class="session-meta">
        Mode: {{ activeSessionTypeLabel }}
      </p>

      <p v-if="isArchivedReadOnly && sessionChooserState === 'hidden'" class="readonly-badge">
        Archived Session (Read-Only)
      </p>
    </header>

    <section
      v-if="settingsPanelState === 'showing'"
      class="session-modal-overlay"
      data-test="settings-panel"
    >
      <div class="session-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <h3 id="settings-title">Settings</h3>

        <div class="settings-fields">
          <label class="settings-field" for="settings-retention-days">
            <span class="settings-field__label">Keep history for</span>
            <select
              id="settings-retention-days"
              :value="retentionDays"
              data-test="settings-retention-select"
              @change="onRetentionDaysChange(Number(($event.target as HTMLSelectElement).value))"
            >
              <option :value="7">7 days</option>
              <option :value="30">30 days</option>
              <option :value="60">60 days</option>
              <option :value="90">90 days</option>
              <option :value="180">180 days</option>
              <option :value="365">1 year</option>
            </select>
          </label>

          <label class="settings-field settings-field--toggle" for="settings-tooltips-enabled">
            <span class="settings-field__label">Show scoring tips</span>
            <input
              id="settings-tooltips-enabled"
              v-model="tooltipsEnabled"
              type="checkbox"
              data-test="settings-tooltips-toggle"
            />
          </label>
        </div>

        <div class="session-modal-actions">
          <button
            type="button"
            class="chooser-button chooser-button--primary"
            data-test="settings-close-button"
            @click="closeSettingsPanel"
          >
            Done
          </button>
        </div>
      </div>
    </section>

    <section v-if="sessionChooserState === 'showing'" class="session-chooser">
      <h2>Sessions</h2>
      <p class="session-chooser-help">
        Start a new game, continue your current session, or review an archived one.
      </p>

      <div class="session-chooser-actions">
        <button
          type="button"
          class="chooser-button chooser-button--primary"
          data-test="new-session-button"
          @click="openNewSessionModal"
        >
          New Session
        </button>

        <div v-if="currentSessionOption" class="current-session-option">
          <button
            type="button"
            class="chooser-button"
            data-test="current-session-button"
            @click="loadCurrentSession"
          >
            <span>Current Session</span>
            <span class="current-session-timestamp"
              >Started {{ formatSessionLabel(currentSessionOption) }}</span
            >
          </button>
        </div>

        <div v-if="previousSessionOptions.length > 0" class="previous-session-picker">
          <label for="previous-session-select">Archived Sessions ({{ retentionDays }} days)</label>
          <select
            id="previous-session-select"
            v-model="selectedPreviousSessionId"
            data-test="previous-session-select"
          >
            <option value="">Select an archived session</option>
            <option
              v-for="session in previousSessionOptions"
              :key="session.sessionId"
              :value="session.sessionId"
            >
              {{ formatSessionLabel(session) }}
            </option>
          </select>
          <button
            type="button"
            class="chooser-button"
            data-test="open-previous-session-button"
            :disabled="!selectedPreviousSessionId"
            @click="loadPreviousSession"
          >
            Open
          </button>
        </div>

        <button
          type="button"
          class="chooser-button chooser-button--danger"
          data-test="delete-sessions-button"
          @click="clearAllStoredSessions"
        >
          <span>Delete All Stored Sessions</span>
          <span class="current-session-timestamp">
            {{ allStoredSessions.length }} session{{ allStoredSessions.length === 1 ? '' : 's' }}
            stored
          </span>
        </button>
      </div>
    </section>

    <section
      v-if="sessionTypeModalState === 'showing'"
      class="session-modal-overlay"
      data-test="session-type-modal"
    >
      <div
        class="session-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-type-title"
      >
        <h3 id="session-type-title">How would you like to track this game?</h3>

        <div class="session-type-options">
          <label
            v-for="option in SESSION_TYPE_OPTIONS"
            :key="option.id"
            class="session-type-option"
          >
            <input
              v-model="selectedSessionType"
              type="radio"
              name="session-type"
              :value="option.id"
            />
            <span>{{ option.label }}</span>
          </label>
        </div>

        <div class="session-modal-actions">
          <button
            type="button"
            class="chooser-button chooser-button--primary"
            data-test="start-session-button"
            @click="createNewSession"
          >
            Start Session
          </button>
          <button type="button" class="chooser-button" @click="closeNewSessionModal">Cancel</button>
        </div>
      </div>
    </section>

    <template v-if="sessionChooserState === 'hidden'">
      <nav class="tab-row" aria-label="Canasta score tabs">
        <div class="tab-group" aria-label="Hand tabs">
          <p class="tab-group-title">Hands</p>
          <div class="hand-pill-row">
            <button
              v-for="tab in HAND_TABS"
              :key="tab.id"
              type="button"
              class="tab-pill tab-pill--hand"
              :class="{ 'tab-pill--active': activeTab === tab.id }"
              @click="setActiveTab(tab.id)"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <button
          type="button"
          class="tab-pill tab-pill--totals"
          :class="{ 'tab-pill--active': activeTab === TOTALS_TAB.id }"
          @click="setActiveTab(TOTALS_TAB.id)"
        >
          {{ TOTALS_TAB.label }}
        </button>
      </nav>

      <section v-if="activeHandTab" class="hand-tab-layout">
        <CanastaHandForm
          v-for="team in TEAMS"
          :key="`${activeHandTab}-${team.id}`"
          :team-id="team.id"
          :team-label="team.label"
          :session-type="currentSessionType"
          :model-value="handState[activeHandTab][team.id]"
          :totals="totalsByHand[activeHandTab][team.id]"
          :went-out-disabled="isWentOutDisabled(activeHandTab, team.id)"
          :is-read-only="isArchivedReadOnly"
          :tooltips-enabled="tooltipsEnabled"
          @update:model-value="updateTeamInputs(activeHandTab, team.id, $event)"
          @save="persistHandState()"
        />
      </section>

      <section v-else class="totals-tab" aria-label="Canasta team totals">
        <div class="totals-tab-inner">
          <h2>Totals</h2>
          <p class="totals-help">Hand 1-4 totals and grand total per team.</p>

          <div
            class="leader-banner"
            :class="{
              'leader-banner--tie': hasAnyScores && !leaderTeamId,
              'leader-banner--active': leaderTeamId,
            }"
          >
            {{ leaderSummary }}
          </div>
        </div>

        <div class="totals-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Team</th>
                <th v-for="tab in HAND_TABS" :key="`head-${tab.id}`">{{ tab.label }}</th>
                <th>Grand Total</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="team in TEAMS"
                :key="`row-${team.id}`"
                :class="{
                  'totals-row--leader': isLeader(team.id),
                  'totals-row--tie': hasAnyScores && !leaderTeamId,
                }"
              >
                <th scope="row">{{ team.label }}</th>
                <td v-for="tab in HAND_TABS" :key="`${team.id}-${tab.id}`">
                  {{ formatNumber(totalsByHand[tab.id][team.id].total) }}
                </td>
                <td
                  class="grand-total"
                  :class="{
                    'grand-total--leader': isLeader(team.id),
                    'grand-total--tie': hasAnyScores && !leaderTeamId,
                  }"
                >
                  {{ formatNumber(totalsByTeam[team.id]) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.canasta-page {
  display: grid;
  gap: 1rem;
  max-width: 550px;
  margin: 0 auto;
}

.canasta-header {
  border: 1px solid var(--ui-border);
  border-radius: 18px;
  padding: 1rem;
  background: linear-gradient(140deg, rgba(240, 250, 240, 0.9), rgba(255, 255, 255, 0.9));
  box-shadow: 0 8px 32px rgba(26, 41, 52, 0.08);
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

.session-meta {
  margin: 0.5rem 0 0;
  color: var(--ui-muted);
  font-size: 0.85rem;
  font-weight: 600;
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

.session-chooser {
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  padding: 1rem;
  background: var(--ui-card);
  display: grid;
  gap: 0.8rem;
}

.session-chooser h2 {
  margin: 0;
  font-size: 1rem;
}

.session-chooser-help {
  margin: 0;
  color: var(--ui-muted);
  font-size: 0.88rem;
}

.session-chooser-actions {
  display: grid;
  gap: 0.6rem;
}

.current-session-option {
  display: grid;
  gap: 0.2rem;
}

.chooser-button .current-session-timestamp {
  display: block;
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--ui-muted);
  margin-top: 0.1rem;
}

.chooser-button {
  min-height: 44px;
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  background: var(--ui-card);
  color: var(--ui-text);
  font-weight: 700;
  padding: 0.45rem 0.7rem;
}

.chooser-button--primary {
  background: linear-gradient(140deg, rgba(221, 239, 249, 0.95), rgba(240, 249, 255, 0.95));
  border-color: #7eb4d4;
}

.chooser-button--danger {
  background: linear-gradient(140deg, rgba(255, 244, 244, 0.95), rgba(255, 250, 250, 0.95));
  border-color: #dfb5b5;
  color: #7e2f2f;
}

.previous-session-picker {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.35rem 0.5rem;
  margin-top: 0.5rem;
}

.previous-session-picker label {
  grid-column: 1 / -1;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ui-muted);
}

.previous-session-picker select {
  min-height: 40px;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  padding: 0 0.5rem;
  background: #fff;
}

.session-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
}

.session-modal {
  width: min(100%, 32rem);
  border-radius: 14px;
  border: 1px solid var(--ui-border);
  background: #fff;
  padding: 1rem;
  display: grid;
  gap: 0.8rem;
}

.session-modal h3 {
  margin: 0;
  font-size: 1rem;
}

.session-type-options {
  display: grid;
  gap: 0.5rem;
}

.session-type-option {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.session-modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.back-to-chooser {
  min-height: 40px;
  min-width: 40px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--ui-muted);
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-to-chooser svg {
  width: 1.1rem;
  height: 1.1rem;
}

.back-to-chooser:focus-visible {
  outline: 2px solid #7eb4d4;
  outline-offset: 2px;
}

.session-controls {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.settings-button {
  min-height: 40px;
  min-width: 40px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--ui-muted);
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-button:focus-visible {
  outline: 2px solid #7eb4d4;
  outline-offset: 2px;
}

.settings-fields {
  display: grid;
  gap: 1rem;
  margin: 1rem 0;
}

.settings-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 1rem;
}

.settings-field__label {
  font-weight: 600;
}

.settings-field--toggle {
  cursor: pointer;
}

.settings-field select {
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  font-size: 1rem;
  background: #fff;
}

.settings-field input[type='checkbox'] {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.tab-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
}

.tab-group {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
}

.tab-group-title {
  margin: 0;
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ui-muted);
}

.hand-pill-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  min-width: max-content;
}

.tab-pill {
  min-height: 48px;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: var(--ui-card);
  color: var(--ui-text);
  font-weight: 700;
  padding: 0.35rem 0.75rem;
  white-space: nowrap;
}

.tab-pill--hand {
  width: 48px;
  min-width: 48px;
  padding: 0;
  justify-content: center;
  font-size: 0.98rem;
}

.tab-pill--totals {
  flex: 0 0 auto;
  min-width: 82px;
  margin-left: auto;
}

.tab-pill--active {
  border-color: #7eb4d4;
  background: linear-gradient(135deg, rgba(221, 239, 249, 0.95), rgba(240, 249, 255, 0.95));
}

.hand-tab-layout {
  display: grid;
  gap: 0.9rem;
}

.totals-tab {
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  padding: 0.9rem;
  background: var(--ui-card);
  display: grid;
  gap: 0.6rem;
}

.totals-tab h2 {
  margin: 0;
  font-size: 1.1rem;
}

.totals-help {
  margin: 0;
  color: var(--ui-muted);
  font-size: 0.9rem;
}

.leader-banner {
  border: 1px solid var(--ui-border);
  border-radius: 12px;
  padding: 0.7rem 0.85rem;
  background: #f7fbff;
  color: var(--ui-muted);
  font-size: 0.9rem;
  font-weight: 700;
  text-align: center;
}

.leader-banner--active {
  background: linear-gradient(135deg, #f8f4d8, #fff8e7);
  color: #6f5313;
  border-color: #e3d29a;
}

.leader-banner--tie {
  background: linear-gradient(135deg, #eef6fb, #f8fbfe);
  color: #1f6f8b;
  border-color: #c9deeb;
}

.totals-table-scroll {
  width: 100%;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th,
td {
  border: 1px solid var(--ui-border);
  padding: 0.4rem 0.2rem;
  text-align: center;
  font-size: 0.78rem;
  overflow-wrap: anywhere;
}

thead th {
  background: #eef6fb;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

tbody th {
  background: #f8fbfe;
  font-size: 0.72rem;
}

.totals-row--leader th,
.totals-row--leader td {
  background: #fffaf0;
}

.totals-row--tie th,
.totals-row--tie td {
  background: #f8fbfe;
}

.grand-total {
  font-weight: 700;
  color: #1f6f8b;
  font-size: 0.74rem;
  transition:
    background-color 140ms ease,
    color 140ms ease,
    box-shadow 140ms ease;
}

.grand-total--leader {
  background: linear-gradient(135deg, #f3df8e, #f8edbb);
  color: #5d4308;
  box-shadow: inset 0 0 0 1px #ddc36c;
}

.grand-total--tie {
  background: linear-gradient(135deg, #ddeff9, #eef6fb);
  color: #1f6f8b;
}

@media (min-width: 780px) {
  .canasta-page {
    gap: 1.3rem;
  }

  .canasta-header {
    padding: 1.4rem;
  }
}
@media screen and (min-width: 1024px) {
  .canasta-page {
    max-width: 1120px;
  }

  .hand-tab-layout {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    gap: 1rem;
  }

  .hand-tab-layout > * {
    min-width: 0;
  }
}
</style>
