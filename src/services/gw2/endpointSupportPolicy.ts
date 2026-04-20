export interface EndpointSupportChipConfig {
  endpointId: string
  label: string
  recordKey: string
}

export const OPTIONAL_ON_404_ENDPOINT_IDS = new Set<string>([
  'account_upgrade_unlocks',
  'account_pvp_hero_unlocks',
  'account_emote_unlocks',
  'account_recipe_unlocks',
])

export const ACCOUNT_UNLOCK_ENDPOINT_SUPPORT_CHIPS: EndpointSupportChipConfig[] = [
  {
    endpointId: 'account_upgrade_unlocks',
    label: 'Upgrades Endpoint',
    recordKey: 'upgrades',
  },
  {
    endpointId: 'account_pvp_hero_unlocks',
    label: 'PvP Heroes Endpoint',
    recordKey: 'pvp-heroes',
  },
  {
    endpointId: 'account_emote_unlocks',
    label: 'Emotes Endpoint',
    recordKey: 'emotes',
  },
  {
    endpointId: 'account_recipe_unlocks',
    label: 'Recipes Endpoint',
    recordKey: 'recipes',
  },
]
