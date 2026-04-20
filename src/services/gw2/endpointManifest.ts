import type { Gw2EndpointDefinition } from '@/types/gw2'

const PUBLIC_ENDPOINTS: Gw2EndpointDefinition[] = [
  {
    id: 'build_info',
    description: 'Current API build version',
    scope: 'public',
    section: 'Progression',
    mode: 'single',
    path: '/v2/build',
  },
  {
    id: 'mini_catalog_ids',
    description: 'Miniature ids available in the game',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/minis',
  },
  {
    id: 'mini_catalog_details',
    description: 'Miniature details expanded from public mini ids',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'csvFrom',
    path: '/v2/minis',
    dependsOn: 'mini_catalog_ids',
    csvParam: 'ids',
    chunkSize: 200,
    extractIds: (dependencyPayload) => {
      const firstPayload = dependencyPayload[0]
      if (!Array.isArray(firstPayload)) {
        return []
      }

      return firstPayload.filter((id): id is number => typeof id === 'number')
    },
  },
  {
    id: 'mount_skin_ids',
    description: 'Mount skin ids available in the game',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/mounts/skins',
  },
  {
    id: 'mount_skin_details',
    description: 'Mount skin details expanded from public mount skin ids',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'csvFrom',
    path: '/v2/mounts/skins',
    dependsOn: 'mount_skin_ids',
    csvParam: 'ids',
    chunkSize: 200,
    extractIds: (dependencyPayload) => {
      const firstPayload = dependencyPayload[0]
      if (!Array.isArray(firstPayload)) {
        return []
      }

      return firstPayload.filter((id): id is number => typeof id === 'number')
    },
  },
  {
    id: 'dye_catalog_ids',
    description: 'Dye ids available in the game',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/colors',
  },
  {
    id: 'dye_catalog_details',
    description: 'Dye details expanded from public dye ids',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'csvFrom',
    path: '/v2/colors',
    dependsOn: 'dye_catalog_ids',
    csvParam: 'ids',
    chunkSize: 200,
    extractIds: (dependencyPayload) => {
      const firstPayload = dependencyPayload[0]
      if (!Array.isArray(firstPayload)) {
        return []
      }

      return firstPayload.filter((id): id is number => typeof id === 'number')
    },
  },
  {
    id: 'mail_carrier_ids',
    description: 'Mail carrier ids available in the game',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/mailcarriers',
  },
  {
    id: 'mail_carrier_details',
    description: 'Mail carrier details expanded from public ids',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'csvFrom',
    path: '/v2/mailcarriers',
    dependsOn: 'mail_carrier_ids',
    csvParam: 'ids',
    chunkSize: 200,
    extractIds: (dependencyPayload) => {
      const firstPayload = dependencyPayload[0]
      if (!Array.isArray(firstPayload)) {
        return []
      }

      return firstPayload.filter((id): id is number => typeof id === 'number')
    },
  },
  {
    id: 'finisher_ids',
    description: 'Finisher ids available in the game',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/finishers',
  },
  {
    id: 'finisher_details',
    description: 'Finisher details expanded from public ids',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'csvFrom',
    path: '/v2/finishers',
    dependsOn: 'finisher_ids',
    csvParam: 'ids',
    chunkSize: 200,
    extractIds: (dependencyPayload) => {
      const firstPayload = dependencyPayload[0]
      if (!Array.isArray(firstPayload)) {
        return []
      }

      return firstPayload.filter((id): id is number => typeof id === 'number')
    },
  },
  {
    id: 'glider_ids',
    description: 'Glider ids available in the game',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/gliders',
  },
  {
    id: 'glider_details',
    description: 'Glider details expanded from public ids',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'csvFrom',
    path: '/v2/gliders',
    dependsOn: 'glider_ids',
    csvParam: 'ids',
    chunkSize: 200,
    extractIds: (dependencyPayload) => {
      const firstPayload = dependencyPayload[0]
      if (!Array.isArray(firstPayload)) {
        return []
      }

      return firstPayload.filter((id): id is number => typeof id === 'number')
    },
  },
  {
    id: 'novelty_ids',
    description: 'Novelty ids available in the game',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/novelties',
  },
  {
    id: 'novelty_details',
    description: 'Novelty details expanded from public ids',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'csvFrom',
    path: '/v2/novelties',
    dependsOn: 'novelty_ids',
    csvParam: 'ids',
    chunkSize: 200,
    extractIds: (dependencyPayload) => {
      const firstPayload = dependencyPayload[0]
      if (!Array.isArray(firstPayload)) {
        return []
      }

      return firstPayload.filter((id): id is number => typeof id === 'number')
    },
  },
  {
    id: 'skiff_ids',
    description: 'Skiff ids available in the game',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/skiffs',
  },
  {
    id: 'skiff_details',
    description: 'Skiff details expanded from public ids',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'csvFrom',
    path: '/v2/skiffs',
    dependsOn: 'skiff_ids',
    csvParam: 'ids',
    chunkSize: 200,
    extractIds: (dependencyPayload) => {
      const firstPayload = dependencyPayload[0]
      if (!Array.isArray(firstPayload)) {
        return []
      }

      return firstPayload.filter((id): id is number => typeof id === 'number')
    },
  },
  {
    id: 'jadebot_ids',
    description: 'Jade bot ids available in the game',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/jadebots',
  },
  {
    id: 'jadebot_details',
    description: 'Jade bot details expanded from public ids',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'csvFrom',
    path: '/v2/jadebots',
    dependsOn: 'jadebot_ids',
    csvParam: 'ids',
    chunkSize: 200,
    extractIds: (dependencyPayload) => {
      const firstPayload = dependencyPayload[0]
      if (!Array.isArray(firstPayload)) {
        return []
      }

      return firstPayload.filter((id): id is number => typeof id === 'number')
    },
  },
  {
    id: 'fishing_ids',
    description: 'Fishing feature ids available in the game',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/fishing',
  },
  {
    id: 'fishing_details',
    description: 'Fishing feature details expanded from public ids',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'csvFrom',
    path: '/v2/fishing',
    dependsOn: 'fishing_ids',
    csvParam: 'ids',
    chunkSize: 200,
    extractIds: (dependencyPayload) => {
      const firstPayload = dependencyPayload[0]
      if (!Array.isArray(firstPayload)) {
        return []
      }

      return firstPayload.filter((id): id is number => typeof id === 'number')
    },
  },
  {
    id: 'wardrobe_skin_ids',
    description: 'Wardrobe skin ids available in the game',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/skins',
  },
  {
    id: 'wardrobe_skin_details',
    description: 'Wardrobe skin details expanded from public ids',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'csvFrom',
    path: '/v2/skins',
    dependsOn: 'wardrobe_skin_ids',
    csvParam: 'ids',
    chunkSize: 200,
    extractIds: (dependencyPayload) => {
      const firstPayload = dependencyPayload[0]
      if (!Array.isArray(firstPayload)) {
        return []
      }

      return firstPayload.filter((id): id is number => typeof id === 'number')
    },
  },
  {
    id: 'recipe_ids',
    description: 'Recipe ids available in the game',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/recipes',
  },
  {
    id: 'recipe_details',
    description: 'Recipe details expanded from public ids',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'csvFrom',
    path: '/v2/recipes',
    dependsOn: 'recipe_ids',
    csvParam: 'ids',
    chunkSize: 200,
    extractIds: (dependencyPayload) => {
      const firstPayload = dependencyPayload[0]
      if (!Array.isArray(firstPayload)) {
        return []
      }

      return firstPayload.filter((id): id is number => typeof id === 'number')
    },
  },
  {
    id: 'pvp_hero_ids',
    description: 'PvP hero ids available in the game',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/pvp/heroes',
  },
  {
    id: 'pvp_hero_details',
    description: 'PvP hero details expanded from public ids',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'csvFrom',
    path: '/v2/pvp/heroes',
    dependsOn: 'pvp_hero_ids',
    csvParam: 'ids',
    chunkSize: 200,
    extractIds: (dependencyPayload) => {
      const firstPayload = dependencyPayload[0]
      if (!Array.isArray(firstPayload)) {
        return []
      }

      return firstPayload.filter((id): id is number => typeof id === 'number')
    },
  },
  {
    id: 'outfit_ids',
    description: 'Outfit ids available in the game',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/outfits',
  },
  {
    id: 'outfit_details',
    description: 'Outfit details expanded from public ids',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'csvFrom',
    path: '/v2/outfits',
    dependsOn: 'outfit_ids',
    csvParam: 'ids',
    chunkSize: 200,
    extractIds: (dependencyPayload) => {
      const firstPayload = dependencyPayload[0]
      if (!Array.isArray(firstPayload)) {
        return []
      }

      return firstPayload.filter((id): id is number => typeof id === 'number')
    },
  },
  {
    id: 'emote_ids',
    description: 'Emote ids available in the game',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/emotes',
  },
  {
    id: 'emote_details',
    description: 'Emote details expanded from public ids',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'csvFrom',
    path: '/v2/emotes',
    dependsOn: 'emote_ids',
    csvParam: 'ids',
    chunkSize: 200,
    extractIds: (dependencyPayload) => {
      const firstPayload = dependencyPayload[0]
      if (!Array.isArray(firstPayload)) {
        return []
      }

      return firstPayload.filter((id): id is number => typeof id === 'number')
    },
  },
  {
    id: 'upgrade_ids',
    description: 'Upgrade ids available in the game',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/upgrades',
  },
  {
    id: 'upgrade_details',
    description: 'Upgrade details expanded from public ids',
    scope: 'public',
    section: 'Account Unlocks',
    mode: 'csvFrom',
    path: '/v2/upgrades',
    dependsOn: 'upgrade_ids',
    csvParam: 'ids',
    chunkSize: 200,
    extractIds: (dependencyPayload) => {
      const firstPayload = dependencyPayload[0]
      if (!Array.isArray(firstPayload)) {
        return []
      }

      return firstPayload.filter((id): id is number => typeof id === 'number')
    },
  },
  {
    id: 'currency_metadata',
    description: 'Full currency catalog used to annotate account wallet balances',
    scope: 'public',
    section: 'Wallet',
    mode: 'csvIds',
    path: '/v2/currencies',
    csvParam: 'ids',
    staticIds: ['all'],
    chunkSize: 1,
  },
  {
    id: 'inventory_item_details',
    description: 'Sample item details via by-id fan out',
    scope: 'public',
    section: 'Inventories',
    mode: 'byId',
    path: '/v2/items',
    staticIds: [19721, 46731],
  },
  {
    id: 'materials_ids',
    description: 'All material storage category ids',
    scope: 'public',
    section: 'Inventories',
    mode: 'single',
    path: '/v2/materials',
  },
  {
    id: 'materials_categories',
    description: 'Material storage categories with item id lists',
    scope: 'public',
    section: 'Inventories',
    mode: 'csvFrom',
    path: '/v2/materials',
    dependsOn: 'materials_ids',
    csvParam: 'ids',
    chunkSize: 50,
    extractIds: (dependencyPayload) => {
      const firstPayload = dependencyPayload[0]
      if (!Array.isArray(firstPayload)) {
        return []
      }

      return firstPayload.filter((id): id is number => typeof id === 'number')
    },
  },
  {
    id: 'materials_details',
    description: 'Item details for all materials in catalog',
    scope: 'public',
    section: 'Inventories',
    mode: 'csvFrom',
    path: '/v2/items',
    dependsOn: 'materials_categories',
    csvParam: 'ids',
    chunkSize: 100,
    extractIds: (dependencyPayload) => {
      const ids = new Set<number>()

      for (const payloadEntry of dependencyPayload) {
        if (!Array.isArray(payloadEntry)) {
          continue
        }

        for (const categoryObj of payloadEntry) {
          if (typeof categoryObj !== 'object' || categoryObj === null) {
            continue
          }

          const items = (categoryObj as Record<string, unknown>).items
          if (!Array.isArray(items)) {
            continue
          }

          for (const itemId of items) {
            if (typeof itemId === 'number') {
              ids.add(itemId)
            }
          }
        }
      }

      return Array.from(ids)
    },
  },
]

const ACCOUNT_ENDPOINTS: Gw2EndpointDefinition[] = [
  {
    id: 'account_overview',
    description: 'Account profile baseline',
    scope: 'account',
    section: 'Progression',
    mode: 'single',
    path: '/v2/account',
    requiredScopes: ['account'],
  },
  {
    id: 'character_names',
    description: 'Character list from account endpoint',
    scope: 'account',
    section: 'Characters',
    mode: 'single',
    path: '/v2/characters',
    requiredScopes: ['characters'],
  },
  {
    id: 'character_core_profiles',
    description: 'Character core profiles expanded from character names',
    scope: 'account',
    section: 'Characters',
    mode: 'expandFrom',
    path: '/v2/characters',
    dependsOn: 'character_names',
    idPathTemplate: '/v2/characters/{id}/core',
    requiredScopes: ['characters'],
    extractIds: (dependencyPayload) => {
      const firstPayload = dependencyPayload[0]
      if (!Array.isArray(firstPayload)) {
        return []
      }

      return firstPayload.filter((name): name is string => typeof name === 'string').slice(0, 12)
    },
  },
  {
    id: 'character_build_tabs',
    description: 'Character build loadouts expanded from character names',
    scope: 'account',
    section: 'Characters',
    mode: 'expandFrom',
    path: '/v2/characters',
    dependsOn: 'character_names',
    idPathTemplate: '/v2/characters/{id}/buildtabs',
    requiredScopes: ['builds'],
    extractIds: (dependencyPayload) => {
      const firstPayload = dependencyPayload[0]
      if (!Array.isArray(firstPayload)) {
        return []
      }

      return firstPayload.filter((name): name is string => typeof name === 'string').slice(0, 6)
    },
  },
  {
    id: 'character_inventory_snapshots',
    description: 'Character inventory expanded from character names',
    scope: 'account',
    section: 'Inventories',
    mode: 'expandFrom',
    path: '/v2/characters',
    dependsOn: 'character_names',
    idPathTemplate: '/v2/characters/{id}/inventory',
    requiredScopes: ['inventories'],
    extractIds: (dependencyPayload) => {
      const firstPayload = dependencyPayload[0]
      if (!Array.isArray(firstPayload)) {
        return []
      }

      return firstPayload.filter((name): name is string => typeof name === 'string').slice(0, 6)
    },
  },
  {
    id: 'account_bank',
    description: 'Account bank slots with item ids and stack counts',
    scope: 'account',
    section: 'Inventories',
    mode: 'single',
    path: '/v2/account/bank',
    requiredScopes: ['inventories'],
  },
  {
    id: 'bank_item_details',
    description: 'Bank item details expanded from occupied bank slot ids',
    scope: 'account',
    section: 'Inventories',
    mode: 'csvFrom',
    path: '/v2/items',
    dependsOn: 'account_bank',
    csvParam: 'ids',
    chunkSize: 100,
    requiredScopes: ['inventories'],
    extractIds: (dependencyPayload) => {
      const ids = new Set<number>()

      for (const payloadEntry of dependencyPayload) {
        if (!Array.isArray(payloadEntry)) {
          continue
        }

        for (const slotEntry of payloadEntry) {
          if (typeof slotEntry !== 'object' || slotEntry === null) {
            continue
          }

          const id = (slotEntry as Record<string, unknown>).id
          if (typeof id === 'number') {
            ids.add(id)
          }
        }
      }

      return Array.from(ids)
    },
  },
  {
    id: 'account_materials',
    description: 'Account material storage with item ids and quantities',
    scope: 'account',
    section: 'Inventories',
    mode: 'single',
    path: '/v2/account/materials',
    requiredScopes: ['inventories'],
  },
  {
    id: 'account_wallet',
    description: 'Wallet balances from account endpoint',
    scope: 'account',
    section: 'Wallet',
    mode: 'single',
    path: '/v2/account/wallet',
    requiredScopes: ['wallet'],
  },
  {
    id: 'account_mini_unlocks',
    description: 'Unlocked mini ids for account',
    scope: 'account',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/account/minis',
    requiredScopes: ['unlocks'],
  },
  {
    id: 'account_mount_skin_unlocks',
    description: 'Unlocked mount skin ids for account',
    scope: 'account',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/account/mounts/skins',
    requiredScopes: ['unlocks'],
  },
  {
    id: 'account_dye_unlocks',
    description: 'Unlocked dye ids for account',
    scope: 'account',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/account/dyes',
    requiredScopes: ['unlocks'],
  },
  {
    id: 'account_mail_carrier_unlocks',
    description: 'Unlocked mail carrier ids for account',
    scope: 'account',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/account/mailcarriers',
    requiredScopes: ['unlocks'],
  },
  {
    id: 'account_finisher_unlocks',
    description: 'Unlocked finisher ids for account',
    scope: 'account',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/account/finishers',
    requiredScopes: ['unlocks'],
  },
  {
    id: 'account_glider_unlocks',
    description: 'Unlocked glider ids for account',
    scope: 'account',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/account/gliders',
    requiredScopes: ['unlocks'],
  },
  {
    id: 'account_novelty_unlocks',
    description: 'Unlocked novelty ids for account',
    scope: 'account',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/account/novelties',
    requiredScopes: ['unlocks'],
  },
  {
    id: 'account_skiff_unlocks',
    description: 'Unlocked skiff ids for account',
    scope: 'account',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/account/skiffs',
    requiredScopes: ['unlocks'],
  },
  {
    id: 'account_jadebot_unlocks',
    description: 'Unlocked jade bot ids for account',
    scope: 'account',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/account/jadebots',
    requiredScopes: ['unlocks'],
  },
  {
    id: 'account_fishing_unlocks',
    description: 'Unlocked fishing feature ids for account',
    scope: 'account',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/account/fishing',
    requiredScopes: ['unlocks'],
  },
  {
    id: 'account_wardrobe_unlocks',
    description: 'Unlocked wardrobe skin ids for account',
    scope: 'account',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/account/skins',
    requiredScopes: ['unlocks'],
  },
  {
    id: 'account_recipe_unlocks',
    description: 'Unlocked recipe ids for account',
    scope: 'account',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/account/recipes',
    requiredScopes: ['unlocks'],
  },
  {
    id: 'account_pvp_hero_unlocks',
    description: 'Unlocked PvP hero ids for account',
    scope: 'account',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/account/pvp/heroes',
    requiredScopes: ['unlocks'],
  },
  {
    id: 'account_outfit_unlocks',
    description: 'Unlocked outfit ids for account',
    scope: 'account',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/account/outfits',
    requiredScopes: ['unlocks'],
  },
  {
    id: 'account_emote_unlocks',
    description: 'Unlocked emote ids for account',
    scope: 'account',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/account/emotes',
    requiredScopes: ['unlocks'],
  },
  {
    id: 'account_upgrade_unlocks',
    description: 'Unlocked upgrade ids for account',
    scope: 'account',
    section: 'Account Unlocks',
    mode: 'single',
    path: '/v2/account/upgrades',
    requiredScopes: ['unlocks'],
  },
  {
    id: 'account_mastery_points',
    description: 'Account mastery point status',
    scope: 'account',
    section: 'Progression',
    mode: 'single',
    path: '/v2/account/mastery/points',
    requiredScopes: ['progression'],
  },
  {
    id: 'account_progression',
    description: 'Account-wide fractal augmentation and luck progression',
    scope: 'account',
    section: 'Progression',
    mode: 'single',
    path: '/v2/account/progression',
    requiredScopes: ['progression'],
  },
  {
    id: 'account_luck',
    description: 'Total account luck consumed',
    scope: 'account',
    section: 'Progression',
    mode: 'single',
    path: '/v2/account/luck',
    requiredScopes: ['progression'],
  },
  {
    id: 'account_achievements_page',
    description: 'Account achievement page sample',
    scope: 'account',
    section: 'Progression',
    mode: 'paged',
    path: '/v2/account/achievements',
    pageSize: 50,
    maxPages: 1,
    requiredScopes: ['progression'],
  },
]

export const GW2_ENDPOINT_MANIFEST = {
  public: PUBLIC_ENDPOINTS,
  account: ACCOUNT_ENDPOINTS,
}

export { PUBLIC_ENDPOINTS, ACCOUNT_ENDPOINTS }
