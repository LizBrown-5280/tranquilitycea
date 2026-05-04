<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import confetti from 'canvas-confetti'

import CanastaHandForm from '@/components/canasta/CanastaHandForm.vue'
import { scoreCanastaHand } from '@/services/canasta/scoring'
import {
  createEmptyCanastaHandInputs,
  type CanastaHandInputs,
  type CanastaTeamId,
} from '@/types/canasta'

type HandTabId = 'hand1' | 'hand2' | 'hand3' | 'hand4'
type CanastaTabId = HandTabId | 'totals'

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

const activeTab = ref<CanastaTabId>('hand1')
const confettiPlayed = ref(false)

const handState = ref<Record<HandTabId, Record<CanastaTeamId, CanastaHandInputs>>>(
  HAND_TABS.reduce(
    (accumulator, tab) => {
      accumulator[tab.id] = {
        teamA: createEmptyCanastaHandInputs(),
        teamB: createEmptyCanastaHandInputs(),
      }
      return accumulator
    },
    {} as Record<HandTabId, Record<CanastaTeamId, CanastaHandInputs>>,
  ),
)

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
}

function updateTeamInputs(handId: HandTabId, teamId: CanastaTeamId, nextValue: CanastaHandInputs) {
  handState.value[handId][teamId] = nextValue
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
</script>

<template>
  <main class="canasta-page">
    <header class="canasta-header">
      <p class="eyebrow">Score Tracker</p>
      <h1>Canasta</h1>
      <p class="intro">Scoring has never been simpler!</p>
    </header>

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
        :team-label="team.label"
        :model-value="handState[activeHandTab][team.id]"
        :totals="totalsByHand[activeHandTab][team.id]"
        :went-out-disabled="isWentOutDisabled(activeHandTab, team.id)"
        @update:model-value="updateTeamInputs(activeHandTab, team.id, $event)"
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
