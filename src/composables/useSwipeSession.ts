import { computed, nextTick, ref } from 'vue'
import type { SwipeSessionEnvelope } from '@/types/swipe'
import {
  getCurrentSession,
  getPreviousSessions,
  sortSessionsByNewest,
} from '@/services/canasta/sessionHelpers'
import {
  loadAllSessions,
  saveSession,
  deleteSession,
  pruneExpiredSessions,
  deleteAllSessions,
} from '@/services/swipe/sessionStorage'
import { cloneSwipeSessionState } from '@/services/swipe/swipeConstants'

const ENTRY_TRANSITION_TOTAL_MS = 1700

export interface SwipeSessionHydration {
  session: SwipeSessionEnvelope
}

export function useSwipeSession() {
  const allStoredSessions = ref<SwipeSessionEnvelope[]>([])
  const activeSession = ref<SwipeSessionEnvelope | null>(null)
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
      if (session.shellState === 'setup' || session.shellState === 'tracker') {
        continue
      }
      deleteSession(session.sessionId)
    }
    refreshStoredSessions()
    sessionChooserState.value = 'showing'
  }

  function hydrateFromSession(
    session: SwipeSessionEnvelope,
    readOnly = false,
  ): SwipeSessionHydration {
    activeSession.value = cloneSwipeSessionState(session)
    isArchivedReadOnly.value = readOnly
    return {
      session: cloneSwipeSessionState(session),
    }
  }

  async function beginSessionEntryTransition(
    session: SwipeSessionEnvelope,
    readOnly = false,
    onHydrate: (hydration: SwipeSessionHydration) => void,
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

  function updateSession(updater: (session: SwipeSessionEnvelope) => SwipeSessionEnvelope): void {
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
        ? window.confirm('Delete all stored Swipe sessions?')
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
    allStoredSessions,
    activeSession,
    isArchivedReadOnly,
    sessionChooserState,
    entryTransitionState,
    isEntryTransitionRunning,
    currentSessionOption,
    previousSessionOptions,
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
