import { describe, expect, it } from 'vitest'

import {
  parseBankSlotEntries,
  parseAccountOverview,
  parseAccountProgressionEntries,
  parseAchievementEntries,
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
  parseProfessionDetails,
  parseRecipeDetails,
  parseUnlockIds,
  parseWalletEntries,
  parseMaterialCategoryEntries,
  parseAccountMaterialEntries,
} from '@/services/gw2/payloadParsers'

describe('payloadParsers', () => {
  it('parses character names and profiles with shape guards', () => {
    const names = parseCharacterNames(['A', 'B', 42, null])
    const profiles = parseCharacterProfiles([
      {
        name: 'A',
        race: 'Asura',
        gender: 'Male',
        profession: 'Elementalist',
        level: 80,
        icon: 'https://cdn.example.com/a.png',
      },
      { name: 'B' },
      { bad: true },
    ])

    expect(names).toEqual(['A', 'B'])
    expect(profiles).toHaveLength(2)
    expect(profiles[0]?.name).toBe('A')
    expect(profiles[0]?.race).toBe('Asura')
    expect(profiles[0]?.profession).toBe('Elementalist')
    expect(profiles[0]?.level).toBe(80)
  })

  it('parses wallet and currency rows safely', () => {
    const metadata = parseCurrencyMetadata([
      { id: 1, icon: 'https://cdn.example.com/c1.png' },
      { id: '2' },
    ])

    const wallet = parseWalletEntries([
      { id: 1, value: 9000 },
      { id: 2, value: 'bad' },
    ])

    expect(metadata).toHaveLength(1)
    expect(metadata[0]?.id).toBe(1)
    expect(wallet).toEqual([{ id: 1, value: 9000 }])
  })

  it('parses occupied bank slot entries', () => {
    const bankSlots = parseBankSlotEntries([
      null,
      { id: 19721, count: 5 },
      { id: 46731, count: 250 },
      { id: 999 },
    ])

    expect(bankSlots).toEqual([
      { id: 19721, count: 5 },
      { id: 46731, count: 250 },
    ])
  })

  it('parses item, recipe, and numeric-id payloads', () => {
    const items = parseItemDetails([
      { id: 100, icon: 'https://cdn.example.com/i100.png' },
      { id: '200' },
    ])

    const recipes = parseRecipeDetails([{ id: 7 }, { bad: true }])
    const ids = parseNumericIds([1, 2, '3', null, 4])

    expect(items).toHaveLength(1)
    expect(recipes).toEqual([{ id: 7 }])
    expect(ids).toEqual([1, 2, 4])
  })

  it('parses build versions, profession details, and generic object entries', () => {
    const buildVersions = parseBuildVersions([12345, 'bad'])
    const professions = parseProfessionDetails([
      { id: 'Guardian', icon: 'https://cdn.example.com/prof-guardian.png' },
      { id: 2 },
    ])
    const objectEntries = parseObjectEntries([{ a: 1 }, null, 'x', { b: 2 }])

    expect(buildVersions).toEqual([{ value: 12345 }])
    expect(professions).toEqual([
      { id: 'Guardian', icon: 'https://cdn.example.com/prof-guardian.png' },
    ])
    expect(objectEntries).toEqual([{ a: 1 }, { b: 2 }])
  })

  it('parses account/progression object payloads and achievement rows', () => {
    const accountOverview = parseAccountOverview([{ id: 'abc', world: 1001 }, null])
    const accountProgression = parseAccountProgressionEntries([
      { id: 'luck', value: 4295449 },
      { id: 'fractal_empowerment', value: 2 },
      { id: 'bad' },
    ])
    const buildTabs = parseBuildTabPayloads([{ tab: 1 }, { tab: 2 }, 'bad'])
    const inventorySnapshots = parseCharacterInventorySnapshots([
      { bags: [{ id: 1 }] },
      42,
      { character: 'Hero.One' },
    ])
    const masteryPoints = parseMasteryPointsPayloads([{ totals: [], unlocked: [] }, undefined])
    const achievements = parseAchievementEntries([{ id: 10, done: true }, { bad: true }, null])

    expect(accountOverview).toEqual([{ id: 'abc', world: 1001 }])
    expect(accountProgression).toEqual([
      { id: 'luck', value: 4295449 },
      { id: 'fractal_empowerment', value: 2 },
    ])
    expect(buildTabs).toEqual([{ tab: 1 }, { tab: 2 }])
    expect(inventorySnapshots).toEqual([{ bags: [{ id: 1 }] }, { character: 'Hero.One' }])
    expect(masteryPoints).toEqual([{ totals: [], unlocked: [] }])
    expect(achievements).toEqual([{ id: 10, done: true }])
  })

  it('parses material category entries with items arrays', () => {
    const categories = parseMaterialCategoryEntries([
      { id: 1, name: 'Basic Crafting Materials', order: 1, items: [12134, 12135, 12136] },
      { id: 5, name: 'Intermediate Materials', order: 5, items: [24876, 24877] },
      { id: 38, name: 'Festive Materials', order: 38, items: [36060, 'bad', 36061] },
      { bad: true },
    ])

    expect(categories).toHaveLength(3)
    expect(categories[0]).toEqual({
      id: 1,
      name: 'Basic Crafting Materials',
      order: 1,
      items: [12134, 12135, 12136],
    })
    expect(categories[2]?.items).toEqual([36060, 36061])
  })

  it('parses account material entries with counts and categories', () => {
    const accountMaterials = parseAccountMaterialEntries([
      { id: 12134, category: 1, count: 64 },
      { id: 24876, category: 5, count: 12, binding: 'Account' },
      { id: 36060, count: 0 },
      { id: 'bad' },
      { category: 5 },
    ])

    expect(accountMaterials).toHaveLength(3)
    expect(accountMaterials[0]).toEqual({ id: 12134, category: 1, count: 64 })
    expect(accountMaterials[1]).toEqual({
      id: 24876,
      category: 5,
      count: 12,
      binding: 'Account',
    })
    expect(accountMaterials[2]).toEqual({ id: 36060, count: 0 })
  })

  it('parses unlock ids from mixed primitives and objects', () => {
    const unlockIds = parseUnlockIds([1, '2', { id: 3 }, { id: '4' }, { bad: true }, null])

    expect(unlockIds).toEqual(['1', '2', '3', '4'])
  })
})
