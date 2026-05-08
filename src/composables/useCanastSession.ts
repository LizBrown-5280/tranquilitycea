import { computed, ref, nextTick } from 'vue'
import type {
  CanastaSessionEnvelope,
  HandTabId,
  CanastaTeamId,
  CanastaHandInputs,
} from '@/types/canasta'
import {
  getCurrentSession,
  getPreviousSessions,
  sortSessionsByNewest,
  isSessionEmpty,
} from '@/services/canasta/sessionHelpers'
import {
  loadAllSessions,
  saveSession,
  deleteSession,
  pruneExpiredSessions,
  deleteAllSessions,
} from '@/services/canasta/sessionStorage'
import { cloneHandState } from '@/services/canasta/canastaConstants'

const ENTRY_TRANSITION_TOTAL_MS = 1700

export interface SessionHydration {
  activeTab: string
  handState: Record<HandTabId, Record<CanastaTeamId, CanastaHandInputs>>
}

export function useCanastSession() {
  const allStoredSessions = ref<CanastaSessionEnvelope[]>([])
  const activeSession = ref<CanastaSessionEnvelope | null>(null)
  const isArchivedReadOnly = ref(false)
  const sessionChooserState = ref<'showing' | 'hidden'>('showing')
  const entryTransitionState = ref<'idle' | 'running'>('idle')
  const entryTransitionTimerIds: number[] = []

  const currentSessionOption = computed(() => getCurrentSession(allStoredSessions.value))
  const previousSessionOptions = computed(() => getPreviousSessions(allStoredSessions.value))
  const isEntryTransitionRunning = computed(() => entryTransitionState.value === 'running')

  function refreshStoredSessions() {
    allStoredSessions.value = sortSessionsByNewest(loadAllSessions())
  }

  function clearEntryTransitionTimers() {
    while (entryTransitionTimerIds.length > 0) {
      const timerId = entryTransitionTimerIds.pop()
      if (timerId !== undefined) {
        window.clearTimeout(timerId)
      }
    }
  }

  function queueEntryTransitionStep(callback: () => void, delayMs: number) {
    const timerId = window.setTimeout(() => {
      const timerIndex = entryTransitionTimerIds.indexOf(timerId)
      if (timerIndex >= 0) {
        entryTransitionTimerIds.splice(timerIndex, 1)
      }
      callback()
    }, delayMs)

    entryTransitionTimerIds.push(timerId)
  }

  function prefersReducedMotion() {
    return (
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  }

  function finishSessionEntryTransition() {
    entryTransitionState.value = 'idle'
    sessionChooserState.value = 'hidden'
  }

  function initializeSessionChooser() {
    clearEntryTransitionTimers()
    entryTransitionState.value = 'idle'
    pruneExpiredSessions()
    for (const session of loadAllSessions()) {
      if (isSessionEmpty(session)) {
        deleteSession(session.sessionId)
      }
    }
    refreshStoredSessions()
    sessionChooserState.value = 'showing'
  }

  function hydrateFromSession(session: CanastaSessionEnvelope, readOnly = false): SessionHydration {
    activeSession.value = session
    isArchivedReadOnly.value = readOnly
    return {
      activeTab: session.activeTab,
      handState: cloneHandState(session.handState),
    }
  }

  async function beginSessionEntryTransition(
    session: CanastaSessionEnvelope,
    readOnly = false,
    onHydrate: (hydration: SessionHydration) => void,
  ) {
    clearEntryTransitionTimers()
    const hydration = hydrateFromSession(session, readOnly)
    onHydrate(hydration)
    sessionChooserState.value = 'hidden'

    if (prefersReducedMotion()) {
      finishSessionEntryTransition()
      return
    }

    await nextTick()
    entryTransitionState.value = 'running'
    queueEntryTransitionStep(() => {
      finishSessionEntryTransition()
    }, ENTRY_TRANSITION_TOTAL_MS)
  }

  function updateSession(
    updater: (session: CanastaSessionEnvelope) => CanastaSessionEnvelope,
  ): void {
    if (!activeSession.value || isArchivedReadOnly.value) {
      return
    }

    activeSession.value = updater(activeSession.value)
    saveSession(activeSession.value)
    refreshStoredSessions()
  }

  function clearAllSessions(): boolean {
    const shouldDelete =
      typeof window.confirm === 'function'
        ? window.confirm('Delete all stored Canasta sessions?')
        : true

    if (!shouldDelete) {
      return false
    }

    deleteAllSessions()
    activeSession.value = null
    initializeSessionChooser()
    return true
  }

  function destroy() {
    clearEntryTransitionTimers()
  }

  return {
    // State
    allStoredSessions,
    activeSession,
    isArchivedReadOnly,
    sessionChooserState,
    entryTransitionState,
    isEntryTransitionRunning,

    // Computed
    currentSessionOption,
    previousSessionOptions,

    // Methods
    refreshStoredSessions,
    clearEntryTransitionTimers,
    queueEntryTransitionStep,
    prefersReducedMotion,
    initializeSessionChooser,
    hydrateFromSession,
    beginSessionEntryTransition,
    updateSession,
    clearAllSessions,
    destroy,
  }
}
