import type { Gw2EndpointRunResult, Gw2SectionData } from '@/types/gw2'

import {
  createMetricCard,
  createSectionRecords,
  deriveSectionState,
  flattenPayloadEntries,
  getSectionResults,
} from '@/services/gw2/aggregators/helpers'

function getNumericField(entry: unknown, key: string): number | undefined {
  if (typeof entry !== 'object' || entry === null) {
    return undefined
  }

  const value = (entry as Record<string, unknown>)[key]
  return typeof value === 'number' ? value : undefined
}

function getStringField(entry: unknown, key: string): string | undefined {
  if (typeof entry !== 'object' || entry === null) {
    return undefined
  }

  const value = (entry as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : undefined
}

function getLatestBuildVersion(entries: unknown[]): number | undefined {
  let latest: number | undefined

  for (const entry of entries) {
    const version = getNumericField(entry, 'value') ?? getNumericField(entry, 'build_id')
    if (version === undefined) {
      continue
    }

    if (latest === undefined || version > latest) {
      latest = version
    }
  }

  return latest
}

function countCompletedAchievements(entries: unknown[]): number {
  let completed = 0

  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null) {
      continue
    }

    const done = (entry as Record<string, unknown>).done
    if (done === true) {
      completed += 1
    }
  }

  return completed
}

function countAccountNames(entries: unknown[]): number {
  let names = 0

  for (const entry of entries) {
    if (getStringField(entry, 'name')) {
      names += 1
    }
  }

  return names
}

function getProgressionValue(entries: unknown[], id: string): number {
  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null) {
      continue
    }

    const record = entry as Record<string, unknown>
    if (record.id === id && typeof record.value === 'number') {
      return record.value
    }
  }

  return 0
}

function formatProgressionLabel(id: string): string {
  const labels: Record<string, string> = {
    luck: 'Luck Consumed',
    fractal_empowerment: 'Account Augmentation: Fractal Empowerment',
    fractal_agony_impedance: 'Account Augmentation: Agony Impedance',
    fractal_karmic_retribution: 'Account Augmentation: Karmic Retribution',
  }

  return labels[id] ?? id
}

function getProgressionDisplayRows(entries: unknown[]): string[] {
  return entries
    .filter(
      (entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null,
    )
    .filter((entry) => typeof entry.id === 'string' && typeof entry.value === 'number')
    .sort((left, right) => String(left.id).localeCompare(String(right.id)))
    .map((entry) => {
      const id = String(entry.id)
      const value = Number(entry.value)

      if (id.startsWith('fractal_')) {
        return `progression display row: ${formatProgressionLabel(id)} - Tier ${value}`
      }

      return `progression display row: ${formatProgressionLabel(id)} - ${value}`
    })
}

function getLuckDisplayRow(entries: unknown[]): string | undefined {
  const luckValue = getProgressionValue(entries, 'luck')

  if (luckValue <= 0) {
    return undefined
  }

  return `progression display row: ${formatProgressionLabel('luck')} - ${luckValue}`
}

export function aggregateProgression(
  allResults: Gw2EndpointRunResult[],
  hasKey: boolean,
): Gw2SectionData {
  const sectionResults = getSectionResults('Progression', allResults)
  const buildInfoResult = sectionResults.find((result) => result.endpointId === 'build_info')
  const accountResult = sectionResults.find((result) => result.endpointId === 'account_overview')
  const masteryResult = sectionResults.find(
    (result) => result.endpointId === 'account_mastery_points',
  )
  const accountProgressionResult = sectionResults.find(
    (result) => result.endpointId === 'account_progression',
  )
  const accountLuckResult = sectionResults.find((result) => result.endpointId === 'account_luck')
  const achievementResult = sectionResults.find(
    (result) => result.endpointId === 'account_achievements_page',
  )

  const buildPayload = buildInfoResult ? flattenPayloadEntries(buildInfoResult.payload) : []
  const accountPayload = accountResult ? flattenPayloadEntries(accountResult.payload) : []
  const masteryEntries = masteryResult ? flattenPayloadEntries(masteryResult.payload) : []
  const accountProgressionEntries = accountProgressionResult
    ? flattenPayloadEntries(accountProgressionResult.payload)
    : []
  const accountLuckEntries = accountLuckResult
    ? flattenPayloadEntries(accountLuckResult.payload)
    : []
  const achievementEntries = achievementResult
    ? flattenPayloadEntries(achievementResult.payload)
    : []
  const latestBuildVersion = getLatestBuildVersion(buildPayload)
  const accountNameCount = countAccountNames(accountPayload)
  const completedAchievements = countCompletedAchievements(achievementEntries)
  const luckValueFromProgression = getProgressionValue(accountProgressionEntries, 'luck')
  const dedicatedLuckValue = getProgressionValue(accountLuckEntries, 'luck')
  const luckValue = dedicatedLuckValue || luckValueFromProgression
  const fractalEmpowerment = getProgressionValue(accountProgressionEntries, 'fractal_empowerment')
  const fractalAgonyImpedance = getProgressionValue(
    accountProgressionEntries,
    'fractal_agony_impedance',
  )
  const fractalKarmicRetribution = getProgressionValue(
    accountProgressionEntries,
    'fractal_karmic_retribution',
  )
  const nonLuckProgressionEntries = accountProgressionEntries.filter((entry) => {
    if (typeof entry !== 'object' || entry === null) {
      return false
    }

    return (entry as Record<string, unknown>).id !== 'luck'
  })
  const progressionRows = getProgressionDisplayRows(nonLuckProgressionEntries)
  const luckDisplayRow =
    getLuckDisplayRow(accountLuckEntries) ?? getLuckDisplayRow(accountProgressionEntries)

  const records = [
    `api build payloads: ${buildPayload.length}`,
    `latest api build version observed: ${latestBuildVersion ?? 'n/a'}`,
    `account profile payloads: ${accountPayload.length}`,
    `account names present: ${accountNameCount}`,
    `mastery point entries: ${masteryEntries.length}`,
    `progression entries loaded: ${accountProgressionEntries.length}`,
    `luck entries loaded: ${accountLuckEntries.length}`,
    `luck consumed total: ${luckValue}`,
    `fractal empowerment level: ${fractalEmpowerment}`,
    `fractal agony impedance level: ${fractalAgonyImpedance}`,
    `fractal karmic retribution level: ${fractalKarmicRetribution}`,
    `achievement entries sampled: ${achievementEntries.length}`,
    `completed achievement entries sampled: ${completedAchievements}`,
    ...(luckDisplayRow ? [luckDisplayRow] : []),
    ...progressionRows,
    ...createSectionRecords(
      sectionResults.filter(
        (result) =>
          result.endpointId !== 'build_info' &&
          result.endpointId !== 'account_overview' &&
          result.endpointId !== 'account_mastery_points' &&
          result.endpointId !== 'account_progression' &&
          result.endpointId !== 'account_luck' &&
          result.endpointId !== 'account_achievements_page',
      ),
    ),
  ]

  const hasMeaningfulProgressionData =
    luckValue > 0 ||
    fractalEmpowerment > 0 ||
    fractalAgonyImpedance > 0 ||
    fractalKarmicRetribution > 0 ||
    masteryEntries.length > 0 ||
    achievementEntries.length > 0

  let summary = 'Public build context loaded for progression.'

  if (!hasKey) {
    summary =
      'Add a progression-scoped API key to reveal Fractals, luck, mastery points, and achievement progress.'
  } else if (hasMeaningfulProgressionData) {
    const summaryParts: string[] = []

    if (luckValue > 0) {
      summaryParts.push(`Luck ${luckValue}`)
    }

    if (fractalEmpowerment > 0 || fractalAgonyImpedance > 0 || fractalKarmicRetribution > 0) {
      summaryParts.push(
        `Fractal augmentations ${fractalEmpowerment}/${fractalAgonyImpedance}/${fractalKarmicRetribution}`,
      )
    }

    if (masteryEntries.length > 0) {
      summaryParts.push(`${masteryEntries.length} mastery entries`)
    }

    if (achievementEntries.length > 0) {
      summaryParts.push(`${achievementEntries.length} achievement entries`)
    }

    summary = summaryParts.join(', ')
  } else {
    summary =
      'Progression endpoints responded, but no Fractals, luck, mastery, or achievement data is surfaced yet.'
  }

  return {
    name: 'Progression',
    state: deriveSectionState('Progression', sectionResults, hasKey),
    summary,
    metrics: [
      createMetricCard(
        'progression-latest-build-version',
        'Latest Build Version',
        latestBuildVersion ?? 'n/a',
        'Highest observed API build version used as progression snapshot context.',
        undefined,
        {
          tone: latestBuildVersion !== undefined ? 'highlight' : 'attention',
          badge: latestBuildVersion !== undefined ? 'Baseline' : 'Needs Data',
        },
      ),
      createMetricCard(
        'progression-luck-value',
        'Luck Consumed',
        luckValue,
        'Total account luck consumed toward base magic find progression.',
        undefined,
        {
          tone: luckValue > 0 ? 'good' : 'attention',
          badge: luckValue > 0 ? 'Ready' : 'Needs Data',
        },
      ),
      createMetricCard(
        'progression-fractal-empowerment',
        'Fractal Empowerment',
        fractalEmpowerment,
        'Account Augmentation tier for bonus damage against fractal foes.',
        undefined,
        {
          tone: fractalEmpowerment > 0 ? 'good' : 'attention',
          badge: fractalEmpowerment > 0 ? `Tier ${fractalEmpowerment}` : 'Needs Data',
        },
      ),
      createMetricCard(
        'progression-fractal-agony-impedance',
        'Agony Impedance',
        fractalAgonyImpedance,
        'Account Augmentation tier reducing incoming agony damage in Fractals.',
        undefined,
        {
          tone: fractalAgonyImpedance > 0 ? 'good' : 'attention',
          badge: fractalAgonyImpedance > 0 ? `Tier ${fractalAgonyImpedance}` : 'Needs Data',
        },
      ),
      createMetricCard(
        'progression-fractal-karmic-retribution',
        'Karmic Retribution',
        fractalKarmicRetribution,
        'Account Augmentation tier increasing karma rewards earned in Fractals.',
        undefined,
        {
          tone: fractalKarmicRetribution > 0 ? 'good' : 'attention',
          badge: fractalKarmicRetribution > 0 ? `Tier ${fractalKarmicRetribution}` : 'Needs Data',
        },
      ),
      createMetricCard(
        'progression-mastery-entry-count',
        'Mastery Entries',
        masteryEntries.length,
        'Mastery point entries loaded from account mastery endpoints.',
        undefined,
        {
          tone: masteryEntries.length > 0 ? 'good' : 'attention',
          badge: masteryEntries.length > 0 ? 'Ready' : 'Needs Data',
        },
      ),
      createMetricCard(
        'progression-completed-achievement-count',
        'Completed Achievements',
        completedAchievements,
        'Achievement entries in the current sample that are marked completed.',
        undefined,
        {
          tone: completedAchievements > 0 ? 'good' : 'attention',
          badge: completedAchievements > 0 ? 'Ready' : 'In Progress',
        },
      ),
    ],
    records,
  }
}
