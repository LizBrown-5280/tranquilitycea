import { describe, expect, it } from 'vitest'

import { ACCOUNT_ENDPOINTS, PUBLIC_ENDPOINTS } from '@/services/gw2/endpointManifest'
import { GW2_API_KEY_SCOPES, GW2_SECTIONS } from '@/types/gw2'

describe('GW2 endpoint manifest', () => {
  it('covers all sections across public and account endpoints', () => {
    const mappedSections = new Set([
      ...PUBLIC_ENDPOINTS.map((endpoint) => endpoint.section),
      ...ACCOUNT_ENDPOINTS.map((endpoint) => endpoint.section),
    ])

    for (const section of GW2_SECTIONS) {
      expect(mappedSections.has(section)).toBe(true)
    }
  })

  it('includes all supported endpoint modes', () => {
    const mappedModes = new Set([
      ...PUBLIC_ENDPOINTS.map((endpoint) => endpoint.mode),
      ...ACCOUNT_ENDPOINTS.map((endpoint) => endpoint.mode),
    ])

    expect(mappedModes).toEqual(
      new Set(['single', 'csvIds', 'csvFrom', 'paged', 'byId', 'expandFrom']),
    )
  })

  it('uses unique endpoint ids across public and account manifests', () => {
    const endpointIds = [...PUBLIC_ENDPOINTS, ...ACCOUNT_ENDPOINTS].map((endpoint) => endpoint.id)
    const uniqueEndpointIds = new Set(endpointIds)

    expect(uniqueEndpointIds.size).toBe(endpointIds.length)
  })

  it('defines requiredScopes for all account endpoints', () => {
    for (const endpoint of ACCOUNT_ENDPOINTS) {
      expect(Array.isArray(endpoint.requiredScopes)).toBe(true)
      expect(endpoint.requiredScopes?.length ?? 0).toBeGreaterThan(0)
    }
  })

  it('limits requiredScopes to known ArenaNet scope names', () => {
    const knownScopes = new Set(GW2_API_KEY_SCOPES)

    for (const endpoint of ACCOUNT_ENDPOINTS) {
      for (const scope of endpoint.requiredScopes ?? []) {
        expect(knownScopes.has(scope)).toBe(true)
      }
    }
  })

  it('expands character core profiles from character names', () => {
    const characterCoreProfiles = ACCOUNT_ENDPOINTS.find(
      (endpoint) => endpoint.id === 'character_core_profiles',
    )

    expect(characterCoreProfiles?.mode).toBe('expandFrom')

    if (characterCoreProfiles?.mode !== 'expandFrom') {
      return
    }

    expect(characterCoreProfiles.dependsOn).toBe('character_names')

    const ids = characterCoreProfiles.extractIds([['A', 'B', 'C']])
    expect(ids).toEqual(['A', 'B', 'C'])
  })

  it('attaches character build tabs to the Characters section', () => {
    const characterBuildTabs = ACCOUNT_ENDPOINTS.find(
      (endpoint) => endpoint.id === 'character_build_tabs',
    )

    expect(characterBuildTabs?.section).toBe('Characters')
    expect(characterBuildTabs?.requiredScopes).toEqual(['builds'])
  })

  it('loads public currency metadata with ids=all', () => {
    const currencyMetadata = PUBLIC_ENDPOINTS.find(
      (endpoint) => endpoint.id === 'currency_metadata',
    )

    expect(currencyMetadata?.mode).toBe('csvIds')

    if (currencyMetadata?.mode !== 'csvIds') {
      return
    }

    expect(currencyMetadata.csvParam).toBe('ids')
    expect(currencyMetadata.staticIds).toEqual(['all'])
    expect(currencyMetadata.chunkSize).toBe(1)
  })

  it('includes dedicated account luck progression endpoint', () => {
    const accountLuck = ACCOUNT_ENDPOINTS.find((endpoint) => endpoint.id === 'account_luck')

    expect(accountLuck?.mode).toBe('single')
    expect(accountLuck?.path).toBe('/v2/account/luck')
    expect(accountLuck?.requiredScopes).toEqual(['progression'])
  })

  it('loads bank item details from account bank ids via csvFrom mode', () => {
    const bankItemDetails = ACCOUNT_ENDPOINTS.find(
      (endpoint) => endpoint.id === 'bank_item_details',
    )

    expect(bankItemDetails?.mode).toBe('csvFrom')

    if (bankItemDetails?.mode !== 'csvFrom') {
      return
    }

    expect(bankItemDetails.dependsOn).toBe('account_bank')
    expect(bankItemDetails.csvParam).toBe('ids')
    expect(bankItemDetails.extractIds([[{ id: 1 }, null, { id: 2 }, { id: 1 }]])).toEqual([1, 2])
  })

  it('maps account unlock families to Account Unlocks section', () => {
    const sectionName = 'Account Unlocks'
    const publicUnlockEndpoints = PUBLIC_ENDPOINTS.filter((endpoint) =>
      [
        'mini_catalog_ids',
        'mini_catalog_details',
        'mount_skin_ids',
        'mount_skin_details',
        'dye_catalog_ids',
        'dye_catalog_details',
        'mail_carrier_ids',
        'mail_carrier_details',
        'finisher_ids',
        'finisher_details',
        'glider_ids',
        'glider_details',
        'novelty_ids',
        'novelty_details',
        'skiff_ids',
        'skiff_details',
        'jadebot_ids',
        'jadebot_details',
        'fishing_ids',
        'fishing_details',
        'wardrobe_skin_ids',
        'wardrobe_skin_details',
        'recipe_ids',
        'recipe_details',
        'pvp_hero_ids',
        'pvp_hero_details',
        'outfit_ids',
        'outfit_details',
        'emote_ids',
        'emote_details',
        'upgrade_ids',
        'upgrade_details',
      ].includes(endpoint.id),
    )
    const accountUnlockEndpoints = ACCOUNT_ENDPOINTS.filter((endpoint) =>
      [
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
      ].includes(endpoint.id),
    )

    expect(publicUnlockEndpoints.length).toBe(32)
    expect(accountUnlockEndpoints.length).toBe(16)

    for (const endpoint of publicUnlockEndpoints) {
      expect(endpoint.section).toBe(sectionName)
    }

    for (const endpoint of accountUnlockEndpoints) {
      expect(endpoint.section).toBe(sectionName)
      expect(endpoint.requiredScopes).toEqual(['unlocks'])
    }
  })

  it('loads materials catalog and item details with csvFrom chain', () => {
    const materialsCategories = PUBLIC_ENDPOINTS.find(
      (endpoint) => endpoint.id === 'materials_categories',
    )
    const materialsDetails = PUBLIC_ENDPOINTS.find(
      (endpoint) => endpoint.id === 'materials_details',
    )
    const accountMaterials = ACCOUNT_ENDPOINTS.find(
      (endpoint) => endpoint.id === 'account_materials',
    )

    // Materials categories depend on material IDs
    expect(materialsCategories?.mode).toBe('csvFrom')
    if (materialsCategories?.mode === 'csvFrom') {
      expect(materialsCategories.dependsOn).toBe('materials_ids')
      expect(materialsCategories.csvParam).toBe('ids')
      expect(materialsCategories.extractIds([[1, 2, 5, 38]])).toEqual([1, 2, 5, 38])
    }

    // Materials details depend on category items
    expect(materialsDetails?.mode).toBe('csvFrom')
    if (materialsDetails?.mode === 'csvFrom') {
      expect(materialsDetails.dependsOn).toBe('materials_categories')
      expect(materialsDetails.csvParam).toBe('ids')
      const itemIds = materialsDetails.extractIds([
        [
          { id: 1, items: [12134, 12135] },
          { id: 5, items: [24876, 24877] },
        ],
      ])
      expect(new Set(itemIds)).toEqual(new Set([12134, 12135, 24876, 24877]))
    }

    // Account materials are single mode
    expect(accountMaterials?.mode).toBe('single')
    expect(accountMaterials?.path).toBe('/v2/account/materials')
    expect(accountMaterials?.requiredScopes).toEqual(['inventories'])
  })
})
