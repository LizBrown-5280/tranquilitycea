import { computed, type Ref } from 'vue'
import type { CanastaHandInputs, CanastaTeamId, HandTabId } from '@/types/canasta'
import { scoreCanastaHand } from '@/services/canasta/scoring'
import { HAND_TABS, TEAMS } from '@/services/canasta/canastaConstants'

export function useCanastaScoring(
  handState: Ref<Record<HandTabId, Record<CanastaTeamId, CanastaHandInputs>>>,
) {
  const totalsByHand = computed(() => {
    const result = {} as Record<
      HandTabId,
      Record<CanastaTeamId, ReturnType<typeof scoreCanastaHand>>
    >

    for (const tab of HAND_TABS) {
      result[tab.id] = {
        teamWe: scoreCanastaHand(handState.value[tab.id].teamWe),
        teamThey: scoreCanastaHand(handState.value[tab.id].teamThey),
      }
    }

    return result
  })

  const totalsByTeam = computed(() => {
    const result: Record<CanastaTeamId, number> = { teamWe: 0, teamThey: 0 }

    for (const tab of HAND_TABS) {
      result.teamWe += totalsByHand.value[tab.id].teamWe.total
      result.teamThey += totalsByHand.value[tab.id].teamThey.total
    }

    return result
  })

  const leaderTeamId = computed<CanastaTeamId | null>(() => {
    if (totalsByTeam.value.teamWe === totalsByTeam.value.teamThey) {
      return null
    }

    return totalsByTeam.value.teamWe > totalsByTeam.value.teamThey ? 'teamWe' : 'teamThey'
  })

  const leadAmount = computed(() => {
    return Math.abs(totalsByTeam.value.teamWe - totalsByTeam.value.teamThey)
  })

  const hasAnyScores = computed(() => {
    return totalsByTeam.value.teamWe !== 0 || totalsByTeam.value.teamThey !== 0
  })

  const isGameComplete = computed(() => {
    if (!leaderTeamId.value) {
      return false
    }

    for (const tab of HAND_TABS) {
      const teamWeTotal = totalsByHand.value[tab.id].teamWe.total
      const teamTheyTotal = totalsByHand.value[tab.id].teamThey.total

      if (teamWeTotal === 0 || teamTheyTotal === 0) {
        return false
      }
    }

    return true
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

    const leadPhrase = leaderTeamId.value === 'teamWe' ? "We're leading by" : "They're leading by"
    return `${leadPhrase} ${leadAmount.value.toLocaleString('en-US')}`
  })

  return {
    totalsByHand,
    totalsByTeam,
    leaderTeamId,
    leadAmount,
    hasAnyScores,
    leaderSummary,
    isGameComplete,
  }
}
