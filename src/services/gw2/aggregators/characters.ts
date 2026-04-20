import type { Gw2EndpointRunResult, Gw2SectionData } from '@/types/gw2'

import {
  createMetricCard,
  createSectionRecords,
  deriveSectionState,
  flattenPayloadEntries,
  getSectionResults,
} from '@/services/gw2/aggregators/helpers'
import {
  parseBuildTabPayloads,
  parseCharacterNames,
  parseCharacterProfiles,
} from '@/services/gw2/payloadParsers'

function countConfiguredBuildTabs(entries: ReturnType<typeof parseBuildTabPayloads>): number {
  let configuredTabs = 0

  for (const entry of entries) {
    if (typeof entry.tab === 'number' || typeof entry.build === 'number') {
      configuredTabs += 1
    }
  }

  return configuredTabs
}

function formatCharacterRow(
  name: string,
  profile?: ReturnType<typeof parseCharacterProfiles>[number],
): string {
  if (!profile) {
    return `character display row: ${name} | core profile pending`
  }

  const levelLabel = typeof profile.level === 'number' ? `L${profile.level}` : 'L?'
  const raceLabel = profile.race ?? 'Unknown Race'
  const professionLabel = profile.profession ?? 'Unknown Profession'
  const genderLabel = profile.gender ?? 'Unknown Gender'

  return `character display row: ${name} | ${levelLabel} ${raceLabel} ${professionLabel} (${genderLabel})`
}

export function aggregateCharacters(
  allResults: Gw2EndpointRunResult[],
  hasKey: boolean,
): Gw2SectionData {
  const sectionResults = getSectionResults('Characters', allResults)
  const namesResult = sectionResults.find((result) => result.endpointId === 'character_names')
  const profileResult = sectionResults.find(
    (result) => result.endpointId === 'character_core_profiles',
  )
  const buildTabsResult = sectionResults.find(
    (result) => result.endpointId === 'character_build_tabs',
  )

  const discoveredNames = parseCharacterNames(
    namesResult ? flattenPayloadEntries(namesResult.payload) : [],
  )
  const discoveredProfiles = parseCharacterProfiles(
    profileResult ? flattenPayloadEntries(profileResult.payload) : [],
  )
  const buildTabEntries = parseBuildTabPayloads(
    buildTabsResult ? flattenPayloadEntries(buildTabsResult.payload) : [],
  )
  const profileByName = new Map(discoveredProfiles.map((profile) => [profile.name, profile]))
  const maxLevelCount = discoveredProfiles.filter((profile) => profile.level === 80).length
  const configuredBuildTabs = countConfiguredBuildTabs(buildTabEntries)
  const characterRows = discoveredNames.map((name) =>
    formatCharacterRow(name, profileByName.get(name)),
  )

  const records = [
    `character names indexed: ${discoveredNames.length}`,
    `character profiles loaded: ${discoveredProfiles.length}`,
    `character build tab payloads: ${buildTabEntries.length}`,
    `configured character build tabs: ${configuredBuildTabs}`,
    `max-level characters: ${maxLevelCount}`,
    ...characterRows,
    ...createSectionRecords(
      sectionResults.filter(
        (result) =>
          result.endpointId !== 'character_names' &&
          result.endpointId !== 'character_core_profiles' &&
          result.endpointId !== 'character_build_tabs',
      ),
    ),
  ]

  return {
    name: 'Characters',
    state: deriveSectionState('Characters', sectionResults, hasKey),
    summary:
      discoveredNames.length > 0
        ? `${discoveredNames.length} character name(s) indexed from account data with ${configuredBuildTabs} configured build(s)`
        : hasKey
          ? 'No character data returned yet for this account key.'
          : 'Add an account API key to load your character roster.',
    metrics: [
      createMetricCard(
        'character-name-count',
        'Character Names',
        discoveredNames.length,
        'Total character names returned from the account character listing endpoint.',
        undefined,
        {
          tone: discoveredNames.length > 0 ? 'good' : 'attention',
          badge: discoveredNames.length > 0 ? 'Ready' : 'Needs Data',
        },
      ),
      createMetricCard(
        'character-profile-count',
        'Profile Payloads',
        discoveredProfiles.length,
        'Profile snapshots currently loaded for character-level overview cards.',
        undefined,
        {
          tone: discoveredProfiles.length > 0 ? 'good' : 'attention',
          badge: discoveredProfiles.length > 0 ? 'Ready' : 'Needs Data',
        },
      ),
      createMetricCard(
        'character-max-level-count',
        'Level 80 Characters',
        maxLevelCount,
        'Character core profiles at max level to quickly spot endgame-ready roster slots.',
        undefined,
        {
          tone: maxLevelCount > 0 ? 'good' : 'attention',
          badge: maxLevelCount > 0 ? 'Ready' : 'In Progress',
        },
      ),
      createMetricCard(
        'character-build-tab-count',
        'Configured Builds',
        configuredBuildTabs,
        'Character build payloads currently attached to the roster section.',
        undefined,
        {
          tone: configuredBuildTabs > 0 ? 'good' : 'attention',
          badge: configuredBuildTabs > 0 ? 'Ready' : 'Needs Data',
        },
      ),
    ],
    records,
  }
}
