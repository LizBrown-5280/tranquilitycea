<script setup lang="ts">
import type { CanastaTeamId, HandTabId, CanastaHandTotals } from '@/types/canasta'
import { HAND_TABS, TEAMS } from '@/services/canasta/canastaConstants'

const props = defineProps<{
  totalsByHand: Record<HandTabId, Record<CanastaTeamId, CanastaHandTotals>>
  totalsByTeam: Record<CanastaTeamId, number>
  leaderTeamId: CanastaTeamId | null
  leaderSummary: string
  hasAnyScores: boolean
}>()

function isLeader(teamId: CanastaTeamId): boolean {
  return props.leaderTeamId === teamId
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}
</script>

<template>
  <section class="totals-tab" aria-label="Canasta team totals">
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

<style scoped>
.totals-tab {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.totals-tab-inner {
  padding: 1rem;
  background: var(--ui-bg);
  border-radius: 12px;
  border: 1px solid var(--ui-border);
}

.totals-tab-inner h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.totals-help {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.leader-banner {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background: var(--neutral-light);
  color: var(--text-secondary);
  font-weight: 500;
  text-align: center;
}

.leader-banner--active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
  color: var(--primary);
}

.leader-banner--tie {
  background: linear-gradient(135deg, rgba(244, 63, 94, 0.1), rgba(251, 146, 60, 0.1));
  color: #f04652;
}

.totals-table-scroll {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid var(--ui-border);
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

thead {
  background: var(--ui-bg);
  border-bottom: 2px solid var(--ui-border);
}

th,
td {
  padding: 0.875rem 1rem;
  text-align: right;
  font-weight: 500;
}

th:first-child,
td:first-child {
  text-align: left;
  font-weight: 600;
}

tbody tr {
  border-bottom: 1px solid var(--ui-border);
}

tbody tr:last-child {
  border-bottom: none;
}

.totals-row--leader {
  background: rgba(59, 130, 246, 0.05);
}

.totals-row--tie {
  background: rgba(244, 63, 94, 0.05);
}

.grand-total {
  font-size: 1.1rem;
  font-weight: 700;
}

.grand-total--leader {
  color: var(--primary);
}

.grand-total--tie {
  color: #f04652;
}
</style>
