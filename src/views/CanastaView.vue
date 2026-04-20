<script setup lang="ts">
import { computed, ref } from 'vue'

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
  { id: 'hand1', label: 'Hand 1' },
  { id: 'hand2', label: 'Hand 2' },
  { id: 'hand3', label: 'Hand 3' },
  { id: 'hand4', label: 'Hand 4' },
]

const ALL_TABS: Array<{ id: CanastaTabId; label: string }> = [
  ...HAND_TABS,
  { id: 'totals', label: 'Totals' },
]

const TEAMS: TeamMeta[] = [
  { id: 'teamA', label: 'Team A' },
  { id: 'teamB', label: 'Team B' },
]

const activeTab = ref<CanastaTabId>('hand1')

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

  return `${leader?.label ?? 'Leading team'} leading by ${formatNumber(leadAmount.value)}`
})

function setActiveTab(tabId: CanastaTabId) {
  activeTab.value = tabId
}

function updateTeamInputs(handId: HandTabId, teamId: CanastaTeamId, nextValue: CanastaHandInputs) {
  handState.value[handId][teamId] = nextValue
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
      <p class="intro">
        Mobile-first hand tracker for two teams. Each hand tab contains Team A and Team B stacked
        with live totals.
      </p>
    </header>

    <nav class="tab-row" aria-label="Canasta score tabs">
      <button
        v-for="tab in ALL_TABS"
        :key="tab.id"
        type="button"
        class="tab-pill"
        :class="{ 'tab-pill--active': activeTab === tab.id }"
        @click="setActiveTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <section v-if="activeHandTab" class="hand-tab-layout">
      <CanastaHandForm
        v-for="team in TEAMS"
        :key="`${activeHandTab}-${team.id}`"
        :team-label="team.label"
        :model-value="handState[activeHandTab][team.id]"
        :totals="totalsByHand[activeHandTab][team.id]"
        @update:model-value="updateTeamInputs(activeHandTab, team.id, $event)"
      />
    </section>

    <section v-else class="totals-tab" aria-label="Canasta team totals">
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
  display: grid;
  grid-template-columns: repeat(5, minmax(88px, 1fr));
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
}

.tab-pill {
  min-height: 44px;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: var(--ui-card);
  color: var(--ui-text);
  font-weight: 700;
  padding: 0.35rem 0.75rem;
  white-space: nowrap;
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
</style>
