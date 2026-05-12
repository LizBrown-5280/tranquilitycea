import {
  parseAccountOverview,
  parseAccountProgressionEntries,
  parseAchievementEntries,
  parseBankSlotEntries,
  parseBuildVersions,
  parseBuildTabPayloads,
  parseCharacterNames,
  parseCharacterInventorySnapshots,
  parseCharacterProfiles,
  parseCurrencyMetadata,
  parseItemDetails,
  parseMasteryPointsPayloads,
  parseNumericIds,
  parseObjectEntries,
  parseUnlockIds,
  parseWalletEntries,
  parseMaterialCategoryEntries,
  parseAccountMaterialEntries,
} from '@/services/gw2/payloadParsers'

type EndpointParser = (entries: unknown[]) => unknown[]

const ENDPOINT_PARSERS: Record<string, EndpointParser> = {
  build_info: parseBuildVersions,
  account_overview: parseAccountOverview,
  account_bank: parseBankSlotEntries,
  character_names: parseCharacterNames,
  character_core_profiles: parseCharacterProfiles,
  character_build_tabs: parseBuildTabPayloads,
  character_inventory_snapshots: parseCharacterInventorySnapshots,
  currency_metadata: parseCurrencyMetadata,
  account_wallet: parseWalletEntries,
  bank_item_details: parseItemDetails,
  bank_related_item_details: parseItemDetails,
  account_progression: parseAccountProgressionEntries,
  account_luck: parseAccountProgressionEntries,
  inventory_item_details: parseItemDetails,
  account_mastery_points: parseMasteryPointsPayloads,
  account_achievements_page: parseAchievementEntries,
  mini_catalog_ids: parseNumericIds,
  mini_catalog_details: parseObjectEntries,
  mount_skin_ids: parseNumericIds,
  mount_skin_details: parseObjectEntries,
  dye_catalog_ids: parseNumericIds,
  dye_catalog_details: parseObjectEntries,
  mail_carrier_ids: parseNumericIds,
  mail_carrier_details: parseObjectEntries,
  finisher_ids: parseNumericIds,
  finisher_details: parseObjectEntries,
  finisher_unlock_item_details: parseObjectEntries,
  finisher_unlock_related_item_details: parseObjectEntries,
  glider_ids: parseNumericIds,
  glider_details: parseObjectEntries,
  novelty_ids: parseNumericIds,
  novelty_details: parseObjectEntries,
  skiff_ids: parseNumericIds,
  skiff_details: parseObjectEntries,
  jadebot_ids: parseNumericIds,
  jadebot_details: parseObjectEntries,
  fishing_ids: parseNumericIds,
  fishing_details: parseObjectEntries,
  wardrobe_skin_ids: parseNumericIds,
  wardrobe_skin_details: parseObjectEntries,
  recipe_ids: parseNumericIds,
  recipe_details: parseObjectEntries,
  pvp_hero_ids: parseNumericIds,
  pvp_hero_details: parseObjectEntries,
  outfit_ids: parseNumericIds,
  outfit_details: parseObjectEntries,
  emote_ids: parseNumericIds,
  emote_details: parseObjectEntries,
  upgrade_ids: parseNumericIds,
  upgrade_details: parseObjectEntries,
  account_mini_unlocks: parseUnlockIds,
  account_mount_skin_unlocks: parseUnlockIds,
  account_dye_unlocks: parseUnlockIds,
  account_mail_carrier_unlocks: parseUnlockIds,
  account_finisher_unlocks: parseObjectEntries,
  account_glider_unlocks: parseUnlockIds,
  account_novelty_unlocks: parseUnlockIds,
  account_skiff_unlocks: parseUnlockIds,
  account_jadebot_unlocks: parseUnlockIds,
  account_fishing_unlocks: parseUnlockIds,
  account_wardrobe_unlocks: parseUnlockIds,
  account_recipe_unlocks: parseUnlockIds,
  account_pvp_hero_unlocks: parseUnlockIds,
  account_outfit_unlocks: parseUnlockIds,
  account_emote_unlocks: parseUnlockIds,
  account_upgrade_unlocks: parseUnlockIds,
  materials_ids: parseNumericIds,
  materials_categories: parseMaterialCategoryEntries,
  materials_details: parseItemDetails,
  materials_related_item_details: parseItemDetails,
  account_materials: parseAccountMaterialEntries,
}

const ALLOW_EMPTY_PARSED_PAYLOAD = new Set([
  'account_bank',
  'materials_ids',
  'mini_catalog_ids',
  'mount_skin_ids',
  'dye_catalog_ids',
  'mail_carrier_ids',
  'finisher_ids',
  'glider_ids',
  'novelty_ids',
  'skiff_ids',
  'jadebot_ids',
  'fishing_ids',
  'wardrobe_skin_ids',
  'recipe_ids',
  'pvp_hero_ids',
  'outfit_ids',
  'emote_ids',
  'upgrade_ids',
  'account_mini_unlocks',
  'account_mount_skin_unlocks',
  'account_dye_unlocks',
  'account_mail_carrier_unlocks',
  'account_finisher_unlocks',
  'account_glider_unlocks',
  'account_novelty_unlocks',
  'account_skiff_unlocks',
  'account_jadebot_unlocks',
  'account_fishing_unlocks',
  'account_wardrobe_unlocks',
  'account_recipe_unlocks',
  'account_pvp_hero_unlocks',
  'account_outfit_unlocks',
  'account_emote_unlocks',
  'account_upgrade_unlocks',
])

export const PARSED_ENDPOINT_IDS = Object.keys(ENDPOINT_PARSERS)

export function hasEndpointParser(endpointId: string): boolean {
  return endpointId in ENDPOINT_PARSERS
}

function normalizeToEntries(payload: unknown): unknown[] {
  return Array.isArray(payload) ? payload : [payload]
}

export function parseEndpointPayload(endpointId: string, payload: unknown): unknown {
  const parser = ENDPOINT_PARSERS[endpointId]
  if (!parser) {
    return payload
  }

  const entries = normalizeToEntries(payload)
  const parsed = parser(entries)

  if (entries.length > 0 && parsed.length === 0 && !ALLOW_EMPTY_PARSED_PAYLOAD.has(endpointId)) {
    throw new Error(`Parser rejected payload for endpoint ${endpointId}`)
  }

  return parsed
}
