import type { Gw2EndpointRunResult, Gw2SectionData } from '@/types/gw2'

import {
  ACCOUNT_UNLOCK_ENDPOINT_SUPPORT_CHIPS,
  type EndpointSupportChipConfig,
} from '@/services/gw2/endpointSupportPolicy'
import {
  createMetricCard,
  createSectionRecords,
  deriveSectionState,
  extractIconUrl,
  flattenPayloadEntries,
  getSectionResults,
} from '@/services/gw2/aggregators/helpers'
import { parseUnlockIds } from '@/services/gw2/payloadParsers'

type UnlockGroup = 'Cosmetic Unlocks' | 'Feature Unlocks'

interface UnlockCategoryConfig {
  label: string
  group: UnlockGroup
  catalogEndpoint: string
  accountEndpoint: string
}

interface UnlockCatalogEntry {
  id: string
  name: string
  iconUrl?: string
}

const UNLOCK_CATEGORY_CONFIGS: UnlockCategoryConfig[] = [
  {
    label: 'Miniatures',
    group: 'Cosmetic Unlocks',
    catalogEndpoint: 'mini_catalog_details',
    accountEndpoint: 'account_mini_unlocks',
  },
  {
    label: 'Mounts',
    group: 'Cosmetic Unlocks',
    catalogEndpoint: 'mount_skin_details',
    accountEndpoint: 'account_mount_skin_unlocks',
  },
  {
    label: 'Dyes',
    group: 'Cosmetic Unlocks',
    catalogEndpoint: 'dye_catalog_details',
    accountEndpoint: 'account_dye_unlocks',
  },
  {
    label: 'Mail Carriers',
    group: 'Cosmetic Unlocks',
    catalogEndpoint: 'mail_carrier_details',
    accountEndpoint: 'account_mail_carrier_unlocks',
  },
  {
    label: 'Finishers',
    group: 'Cosmetic Unlocks',
    catalogEndpoint: 'finisher_details',
    accountEndpoint: 'account_finisher_unlocks',
  },
  {
    label: 'Gliders',
    group: 'Cosmetic Unlocks',
    catalogEndpoint: 'glider_details',
    accountEndpoint: 'account_glider_unlocks',
  },
  {
    label: 'Novelties',
    group: 'Cosmetic Unlocks',
    catalogEndpoint: 'novelty_details',
    accountEndpoint: 'account_novelty_unlocks',
  },
  {
    label: 'Skiffs',
    group: 'Feature Unlocks',
    catalogEndpoint: 'skiff_details',
    accountEndpoint: 'account_skiff_unlocks',
  },
  {
    label: 'Jade Bots',
    group: 'Feature Unlocks',
    catalogEndpoint: 'jadebot_details',
    accountEndpoint: 'account_jadebot_unlocks',
  },
  {
    label: 'Fishing',
    group: 'Feature Unlocks',
    catalogEndpoint: 'fishing_details',
    accountEndpoint: 'account_fishing_unlocks',
  },
  {
    label: 'Wardrobe',
    group: 'Cosmetic Unlocks',
    catalogEndpoint: 'wardrobe_skin_details',
    accountEndpoint: 'account_wardrobe_unlocks',
  },
  {
    label: 'Recipes',
    group: 'Feature Unlocks',
    catalogEndpoint: 'recipe_details',
    accountEndpoint: 'account_recipe_unlocks',
  },
  {
    label: 'PvP Heroes',
    group: 'Feature Unlocks',
    catalogEndpoint: 'pvp_hero_details',
    accountEndpoint: 'account_pvp_hero_unlocks',
  },
  {
    label: 'Outfits',
    group: 'Cosmetic Unlocks',
    catalogEndpoint: 'outfit_details',
    accountEndpoint: 'account_outfit_unlocks',
  },
  {
    label: 'Emotes',
    group: 'Cosmetic Unlocks',
    catalogEndpoint: 'emote_details',
    accountEndpoint: 'account_emote_unlocks',
  },
  {
    label: 'Upgrades',
    group: 'Feature Unlocks',
    catalogEndpoint: 'upgrade_details',
    accountEndpoint: 'account_upgrade_unlocks',
  },
]

function asRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getString(value: Record<string, unknown>, key: string): string | undefined {
  const field = value[key]
  return typeof field === 'string' ? field : undefined
}

function getId(value: Record<string, unknown>): string | undefined {
  const field = value.id

  if (typeof field === 'number' || typeof field === 'string') {
    return String(field)
  }

  return undefined
}

function parseUnlockCatalogEntries(entries: unknown[]): UnlockCatalogEntry[] {
  const catalog: UnlockCatalogEntry[] = []

  for (const entry of entries) {
    if (!asRecord(entry)) {
      continue
    }

    const id = getId(entry)
    if (!id) {
      continue
    }

    const name = getString(entry, 'name') ?? `Unlock ${id}`
    const iconUrl =
      getString(entry, 'icon') ?? getString(entry, 'iconUrl') ?? getString(entry, 'icon_url')

    catalog.push({ id, name, iconUrl })
  }

  return catalog
}

function deriveSupportState(
  hasKey: boolean,
  endpointResult: Gw2EndpointRunResult | undefined,
): {
  value: string
  badge: string
  tone: 'good' | 'attention' | 'neutral'
  description: string
} {
  if (!hasKey) {
    return {
      value: 'No Key',
      badge: 'No Key',
      tone: 'neutral',
      description: 'Support check runs after loading account unlock endpoints with an API key.',
    }
  }

  if (!endpointResult) {
    return {
      value: 'Not Loaded',
      badge: 'Pending',
      tone: 'neutral',
      description: 'Endpoint has not been attempted yet in this load cycle.',
    }
  }

  if (!endpointResult.ok) {
    return {
      value: 'Error',
      badge: 'Error',
      tone: 'attention',
      description: 'Endpoint returned an error response.',
    }
  }

  if (endpointResult.requestCount > 0 && endpointResult.payload.length === 0) {
    return {
      value: 'Unavailable',
      badge: '404-safe',
      tone: 'attention',
      description:
        'No payload was returned. This endpoint is treated as optional to avoid false failures.',
    }
  }

  return {
    value: 'Supported',
    badge: 'Live',
    tone: 'good',
    description: 'Endpoint payload loaded successfully.',
  }
}

function buildSupportMetric(
  chipConfig: EndpointSupportChipConfig,
  supportState: ReturnType<typeof deriveSupportState>,
) {
  return createMetricCard(
    `account-unlocks-endpoint-status-${chipConfig.endpointId}`,
    chipConfig.label,
    supportState.value,
    supportState.description,
    undefined,
    {
      tone: supportState.tone,
      badge: supportState.badge,
    },
  )
}

function sortSupportChipConfigs(
  chipConfigs: EndpointSupportChipConfig[],
): EndpointSupportChipConfig[] {
  return [...chipConfigs].sort((left, right) => left.label.localeCompare(right.label))
}

export function aggregateUnlocks(
  allResults: Gw2EndpointRunResult[],
  hasKey: boolean,
): Gw2SectionData {
  const sectionResults = getSectionResults('Account Unlocks', allResults)
  const records: string[] = []
  const categoryRows: string[] = []

  let cosmeticOwned = 0
  let cosmeticTotal = 0
  let featureOwned = 0
  let featureTotal = 0

  for (const config of UNLOCK_CATEGORY_CONFIGS) {
    const catalogResult = sectionResults.find(
      (result) => result.endpointId === config.catalogEndpoint,
    )
    const accountResult = sectionResults.find(
      (result) => result.endpointId === config.accountEndpoint,
    )

    const catalogEntries = parseUnlockCatalogEntries(
      catalogResult ? flattenPayloadEntries(catalogResult.payload) : [],
    )
    const ownedIds = new Set(
      parseUnlockIds(accountResult ? flattenPayloadEntries(accountResult.payload) : []),
    )

    const ownedCount = catalogEntries.reduce(
      (count, unlockEntry) => count + (ownedIds.has(unlockEntry.id) ? 1 : 0),
      0,
    )

    if (config.group === 'Cosmetic Unlocks') {
      cosmeticOwned += ownedCount
      cosmeticTotal += catalogEntries.length
    } else {
      featureOwned += ownedCount
      featureTotal += catalogEntries.length
    }

    records.push(
      `account unlock category: ${config.label} | group=${config.group} | owned=${ownedCount}/${catalogEntries.length}`,
    )

    for (const unlockEntry of catalogEntries.slice(0, 20)) {
      categoryRows.push(
        `account unlock display row: ${JSON.stringify({
          group: config.group,
          category: config.label,
          id: unlockEntry.id,
          name: unlockEntry.name,
          owned: ownedIds.has(unlockEntry.id),
          iconUrl: unlockEntry.iconUrl,
        })}`,
      )
    }
  }

  const totalOwned = cosmeticOwned + featureOwned
  const totalCatalog = cosmeticTotal + featureTotal
  const ownershipPercent = totalCatalog > 0 ? Math.round((totalOwned / totalCatalog) * 100) : 0

  const endpointSupportMetrics = sortSupportChipConfigs(ACCOUNT_UNLOCK_ENDPOINT_SUPPORT_CHIPS).map(
    (chipConfig) => {
      const endpointResult = sectionResults.find(
        (result) => result.endpointId === chipConfig.endpointId,
      )
      const supportState = deriveSupportState(hasKey, endpointResult)
      records.push(`account unlock endpoint status: ${chipConfig.recordKey}=${supportState.value}`)
      return buildSupportMetric(chipConfig, supportState)
    },
  )

  const firstIcon = extractIconUrl(
    sectionResults.flatMap((result) => flattenPayloadEntries(result.payload)),
  )

  const sectionRecords = [
    ...records,
    ...categoryRows,
    ...createSectionRecords(
      sectionResults.filter(
        (result) =>
          !UNLOCK_CATEGORY_CONFIGS.some(
            (config) =>
              config.catalogEndpoint === result.endpointId ||
              config.accountEndpoint === result.endpointId,
          ) && !result.endpointId.endsWith('_ids'),
      ),
    ),
  ]

  return {
    name: 'Account Unlocks',
    state: deriveSectionState('Account Unlocks', sectionResults, hasKey),
    summary: `${totalOwned}/${totalCatalog} unlocks owned (${ownershipPercent}% complete) across cosmetic and feature groups.`,
    metrics: [
      createMetricCard(
        'account-unlocks-total-owned',
        'Owned Unlocks',
        totalOwned,
        'Number of known unlocks currently owned by this account.',
        firstIcon,
        {
          tone: totalOwned > 0 ? 'good' : 'attention',
          badge: totalOwned > 0 ? 'Owned' : 'Needs Data',
        },
      ),
      createMetricCard(
        'account-unlocks-total-catalog',
        'Total Unlocks',
        totalCatalog,
        'Total unlockable entries currently loaded from public endpoints.',
        undefined,
        {
          tone: totalCatalog > 0 ? 'good' : 'attention',
          badge: totalCatalog > 0 ? 'Ready' : 'Needs Data',
        },
      ),
      createMetricCard(
        'account-unlocks-cosmetic-owned',
        'Cosmetic Owned',
        `${cosmeticOwned}/${cosmeticTotal}`,
        'Owned entries for cosmetics: minis, mounts, dyes, mail carriers, finishers, gliders, novelties, wardrobe, outfits, emotes.',
        undefined,
        {
          tone: cosmeticOwned > 0 ? 'good' : 'attention',
          badge: 'Cosmetic',
        },
      ),
      createMetricCard(
        'account-unlocks-feature-owned',
        'Feature Owned',
        `${featureOwned}/${featureTotal}`,
        'Owned entries for feature unlocks: skiffs, jade bots, fishing, recipes, PvP heroes, upgrades.',
        undefined,
        {
          tone: featureOwned > 0 ? 'good' : 'attention',
          badge: 'Feature',
        },
      ),
      ...endpointSupportMetrics,
    ],
    records: sectionRecords,
  }
}
