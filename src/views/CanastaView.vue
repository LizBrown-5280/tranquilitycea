<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import confetti from 'canvas-confetti'

import canastaLogoUrl from '@/assets/CanastaLogo.png'
import CanastaHandForm from '@/components/canasta/CanastaHandForm.vue'
import CanastaTabBar from '@/components/canasta/CanastaTabBar.vue'
import CanastaGameTotals from '@/components/canasta/CanastaGameTotals.vue'
import CanastaSessionSelector from '@/components/canasta/CanastaSessionSelector.vue'
import CanastaSettingsModal from '@/components/canasta/CanastaSettingsModal.vue'
import CanastaSessionTypeModal from '@/components/canasta/CanastaSessionTypeModal.vue'
import {
  getSessionRetentionDays,
  setSessionRetentionDays,
  getTooltipsEnabled,
  setTooltipsEnabled,
  saveSession,
} from '@/services/canasta/sessionStorage'
import {
  type CanastaSessionEnvelope,
  createEmptyCanastaSessionEnvelope,
  type CanastaHandInputs,
  type CanastaSessionType,
  type CanastaTabId,
  type CanastaTeamId,
  type HandTabId,
} from '@/types/canasta'
import {
  TEAMS,
  SESSION_TYPE_OPTIONS,
  createDefaultHandState,
  cloneHandState,
} from '@/services/canasta/canastaConstants'
import { useCanastaTabs } from '@/composables/useCanastaTabs'
import { useCanastSession } from '@/composables/useCanastSession'
import { useCanastaScoring } from '@/composables/useCanastaScoring'

// Composables
const { activeTab, activeHandTab, setActiveTab: setTabFromComposable } = useCanastaTabs('hand1')
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
  updateSession,
  clearAllSessions,
  queueEntryTransitionStep,
  prefersReducedMotion,
  destroy: destroySession,
} = useCanastSession()

// UI State
const confettiPlayed = ref(false)
const sessionTypeModalState = ref<'showing' | 'hidden'>('hidden')
const settingsPanelState = ref<'showing' | 'hidden'>('hidden')
const retentionDays = ref<number>(90)
const tooltipsEnabled = ref<boolean>(true)
const selectedSessionType = ref<CanastaSessionType>('bothTeams')
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
const CURRENT_SESSION_WINDOW_MS = 4 * 60 * 60 * 1000
const DEV_ARCHIVE_SEED_AGES_MS = [6 * 60 * 60 * 1000, 30 * 60 * 60 * 1000]

// Hand state for scoring
const handState =
  ref<Record<HandTabId, Record<CanastaTeamId, CanastaHandInputs>>>(createDefaultHandState())

// Computed - UI visibility
const shouldRenderChooserContent = computed(() => {
  return sessionChooserState.value === 'showing' || isEntryTransitionRunning.value
})

const shouldRenderSessionContent = computed(() => {
  return (
    activeSession.value !== null &&
    (sessionChooserState.value === 'hidden' || isEntryTransitionRunning.value)
  )
})

// Computed - Session info
const currentSessionType = computed<CanastaSessionType>(() => {
  return activeSession.value?.sessionType ?? 'bothTeams'
})

const activeSessionTypeLabel = computed(() => {
  const sessionType = activeSession.value?.sessionType
  return SESSION_TYPE_OPTIONS.find((option) => option.id === sessionType)?.label ?? ''
})

// Computed - Animation
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
  session: CanastaSessionEnvelope,
  isArchivedSession: boolean,
  hydrationCallback: (hydration: { activeTab: string; handState: typeof handState.value }) => void,
) {
  entryTransitionMetrics.value = measureEntryTransitionMetrics()
  await beginSessionEntryTransition(session, isArchivedSession, hydrationCallback)
}

// Tab management
function setActiveTab(tabId: CanastaTabId) {
  setTabFromComposable(tabId)
  updateSession((session) => ({
    ...session,
    activeTab: tabId,
    handState: cloneHandState(handState.value),
    updatedAt: Date.now(),
  }))
}

// Session loading
async function loadCurrentSession() {
  if (!currentSessionOption.value || isEntryTransitionRunning.value) {
    return
  }

  await runSessionEntryTransition(currentSessionOption.value, false, (hydration) => {
    activeTab.value = hydration.activeTab as CanastaTabId
    handState.value = hydration.handState
    confettiPlayed.value = false
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

  await runSessionEntryTransition(selectedSession, true, (hydration) => {
    activeTab.value = hydration.activeTab as CanastaTabId
    handState.value = hydration.handState
    confettiPlayed.value = false
  })
}

// Session creation
function openNewSessionModal() {
  selectedSessionType.value = 'bothTeams'
  sessionTypeModalState.value = 'showing'
}

function closeNewSessionModal() {
  sessionTypeModalState.value = 'hidden'
}

async function createNewSession() {
  const newSession = createEmptyCanastaSessionEnvelope(selectedSessionType.value)
  saveSession(newSession)
  refreshStoredSessions()
  closeNewSessionModal()

  if (!prefersReducedMotion()) {
    await new Promise<void>((resolve) => {
      queueEntryTransitionStep(() => resolve(), NEW_SESSION_START_DELAY_MS)
    })
  }

  await runSessionEntryTransition(newSession, false, (hydration) => {
    activeTab.value = hydration.activeTab as CanastaTabId
    handState.value = hydration.handState
    confettiPlayed.value = false
  })
}

// Session UI
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

function seedArchivedSessionsForDevPreview() {
  if (!import.meta.env.DEV) {
    return
  }

  if (previousSessionOptions.value.length > 0) {
    return
  }

  const now = Date.now()

  for (const [index, ageMs] of DEV_ARCHIVE_SEED_AGES_MS.entries()) {
    const sessionTimestamp = now - Math.max(ageMs, CURRENT_SESSION_WINDOW_MS + 1) - index
    const seededSession = createEmptyCanastaSessionEnvelope('bothTeams')
    const seededHandState = cloneHandState(seededSession.handState)

    // Keep seeded archive sessions from being treated as empty and auto-pruned.
    seededHandState.hand1.teamWe.cardCount = index + 1

    saveSession({
      ...seededSession,
      sessionId: sessionTimestamp,
      createdAt: sessionTimestamp,
      updatedAt: sessionTimestamp,
      handState: seededHandState,
    })
  }

  refreshStoredSessions()
}

// Scoring & game state
const { totalsByHand, totalsByTeam, leaderTeamId, hasAnyScores, leaderSummary, isGameComplete } =
  useCanastaScoring(handState)

// Input handling
function updateTeamInputs(handId: HandTabId, teamId: CanastaTeamId, nextValue: CanastaHandInputs) {
  if (isArchivedReadOnly.value) {
    return
  }

  handState.value[handId][teamId] = nextValue
}

function persistHandState() {
  updateSession((session) => ({
    ...session,
    activeTab: activeTab.value,
    handState: cloneHandState(handState.value),
    updatedAt: Date.now(),
  }))
}

function isWentOutDisabled(handId: HandTabId, teamId: CanastaTeamId): boolean {
  const opposingTeamId: CanastaTeamId = teamId === 'teamWe' ? 'teamThey' : 'teamWe'
  return handState.value[handId][opposingTeamId].wentOut
}

// Confetti
function fireConfetti() {
  const count = 200
  const defaults: Parameters<typeof confetti>[0] = {
    origin: { y: 0.7 },
  }

  function fire(particleRatio: number, opts: Parameters<typeof confetti>[0]) {
    confetti(
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

// Watchers
watch(
  () => ({ isComplete: isGameComplete.value, activeTab: activeTab.value }),
  ({ isComplete, activeTab: currentTab }) => {
    if (isComplete && !confettiPlayed.value && currentTab === 'totals') {
      confettiPlayed.value = true
      fireConfetti()
    }
  },
)

watch(tooltipsEnabled, (value) => {
  setTooltipsEnabled(value)
})

// Lifecycle
onMounted(() => {
  initializeSessionChooser()
  seedArchivedSessionsForDevPreview()
  retentionDays.value = getSessionRetentionDays()
  tooltipsEnabled.value = getTooltipsEnabled()
})

onBeforeUnmount(() => {
  destroySession()
})

// Session cleanup
function clearAllStoredSessions() {
  const wasDeleted = clearAllSessions()
  if (wasDeleted) {
    activeTab.value = 'hand1'
    handState.value = createDefaultHandState()
  }
}
</script>

<template>
  <main
    class="canasta-page"
    :class="{ 'canasta-page--entry-transition': isEntryTransitionRunning }"
  >
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
        <div ref="headerLogoRef" class="header-logo">
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

    <CanastaSettingsModal
      :is-showing="settingsPanelState === 'showing'"
      :retention-days="retentionDays"
      :tooltips-enabled="tooltipsEnabled"
      @close="closeSettingsPanel"
      @update-retention="onRetentionDaysChange"
      @update-tooltips="(value) => (tooltipsEnabled = value)"
    />

    <CanastaSessionTypeModal
      :is-showing="sessionTypeModalState === 'showing'"
      :selected-type="selectedSessionType"
      @close="closeNewSessionModal"
      @update-type="(type) => (selectedSessionType = type)"
      @confirm="createNewSession"
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
        @new-session="openNewSessionModal"
        @load-current-session="loadCurrentSession"
        @load-previous-session="loadPreviousSession"
        @delete-all-sessions="clearAllStoredSessions"
      />

      <div
        v-if="shouldRenderSessionContent"
        class="session-active-view"
        :aria-hidden="sessionChooserState === 'showing' && !isEntryTransitionRunning"
      >
        <CanastaTabBar
          :active-tab="activeTab"
          :is-transitioning="isEntryTransitionRunning"
          @update-tab="setActiveTab"
        />

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
            :hand-label="`Hand ${activeHandTab.replace('hand', '')}`"
            @update:model-value="updateTeamInputs(activeHandTab, team.id, $event)"
            @save="persistHandState()"
          />
        </section>

        <CanastaGameTotals
          v-else
          :totals-by-hand="totalsByHand"
          :totals-by-team="totalsByTeam"
          :leader-team-id="leaderTeamId"
          :leader-summary="leaderSummary"
          :has-any-scores="hasAnyScores"
        />
      </div>
    </div>

    <div
      v-if="isEntryTransitionRunning"
      class="session-logo-overlay"
      :style="logoOverlayStyle"
      aria-hidden="true"
    >
      <img :src="canastaLogoUrl" alt="" />
    </div>
  </main>
</template>

<style scoped>
.canasta-page {
  display: grid;
  gap: 1rem;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
}

.canasta-header {
  border: 1px solid var(--ui-border);
  border-radius: 18px;
  padding: 1rem;
  background: linear-gradient(140deg, rgba(240, 250, 240, 0.9), rgba(255, 255, 255, 0.9));
  box-shadow: 0 8px 32px rgba(26, 41, 52, 0.08);
}

.canasta-page--entry-transition {
  pointer-events: none;
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

.canasta-page--entry-transition .header-logo {
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

.session-shell {
  position: relative;
  display: grid;
  gap: 1rem;
}

.session-active-view {
  display: grid;
  gap: 1rem;
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

.session-logo-overlay {
  position: fixed;
  left: calc(50% - (var(--entry-logo-target-size) / 2));
  top: calc(50% - (var(--entry-logo-target-size) / 2));
  width: var(--entry-logo-target-size);
  height: var(--entry-logo-target-size);
  z-index: 60;
  pointer-events: none;
  transform: translate(var(--entry-logo-start-x), var(--entry-logo-start-y))
    scale(var(--entry-logo-start-scale));
  will-change: transform;
  animation: sessionLogoBurst var(--entry-transition-duration) linear forwards;
}

.session-logo-overlay img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 20px 28px rgba(15, 23, 42, 0.18));
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

@keyframes sessionChooserFadeOut {
  0% {
    transform: scale(1);
    filter: blur(0);
  }

  100% {
    opacity: 0;
    transform: scale(0.985);
    filter: blur(3px);
  }
}

@keyframes sessionActiveFadeIn {
  0% {
    opacity: 0;
    transform: translateY(1rem);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes sessionLogoBurst {
  0% {
    transform: translate(var(--entry-logo-start-x), var(--entry-logo-start-y))
      scale(var(--entry-logo-start-scale));
  }

  44.12% {
    transform: translate(0px, 0px) scale(1.15);
  }

  67.65% {
    transform: translate(0px, 0px) scale(1.15);
  }

  89.71% {
    transform: translate(0px, 0px) scale(1.45);
  }

  100% {
    transform: translate(var(--entry-logo-start-x), var(--entry-logo-start-y))
      scale(var(--entry-logo-start-scale));
  }
}

@media (prefers-reduced-motion: reduce) {
  .session-shell--transitioning > .session-chooser,
  .session-shell--transitioning > .session-active-view,
  .session-logo-overlay {
    animation: none;
  }
}

@media (min-width: 780px) {
  .canasta-page {
    gap: 1.3rem;
  }

  .canasta-header {
    padding: 1.4rem;
  }
}
@media screen and (min-width: 800px) {
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
