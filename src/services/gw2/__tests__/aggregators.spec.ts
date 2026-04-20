import { describe, expect, it } from 'vitest'

import { aggregateCharacters } from '@/services/gw2/aggregators/characters'
import { aggregateInventories } from '@/services/gw2/aggregators/inventories'
import { aggregateProgression } from '@/services/gw2/aggregators/progression'
import { aggregateUnlocks } from '@/services/gw2/aggregators/unlocks'
import { aggregateWallet } from '@/services/gw2/aggregators/wallet'
import type { Gw2EndpointRunResult } from '@/types/gw2'

describe('section aggregators', () => {
  it('aggregates character metrics from names and profile payloads', () => {
    const results: Gw2EndpointRunResult[] = [
      {
        endpointId: 'character_names',
        section: 'Characters',
        scope: 'account',
        mode: 'single',
        ok: true,
        requestCount: 1,
        payload: [['One', 'Two', 'Three']],
      },
      {
        endpointId: 'character_core_profiles',
        section: 'Characters',
        scope: 'account',
        mode: 'expandFrom',
        ok: true,
        requestCount: 2,
        payload: [
          [
            {
              name: 'One',
              race: 'Asura',
              gender: 'Male',
              profession: 'Elementalist',
              level: 80,
            },
            {
              name: 'Two',
              race: 'Human',
              gender: 'Female',
              profession: 'Guardian',
              level: 40,
            },
          ],
        ],
      },
      {
        endpointId: 'character_build_tabs',
        section: 'Characters',
        scope: 'account',
        mode: 'expandFrom',
        ok: true,
        requestCount: 2,
        payload: [{ tab: 1 }, { build: 2 }],
      },
    ]

    const aggregated = aggregateCharacters(results, true)

    expect(aggregated.state).toBe('available')
    expect(aggregated.summary).toContain('3 character name(s)')
    expect(aggregated.metrics[0]?.label).toBe('Character Names')
    expect(aggregated.metrics[0]?.value).toBe('3')
    expect(aggregated.metrics[0]?.tone).toBe('good')
    expect(aggregated.metrics[0]?.badge).toBe('Ready')
    expect(aggregated.metrics[1]?.tone).toBe('good')
    expect(aggregated.metrics[2]?.label).toBe('Level 80 Characters')
    expect(aggregated.metrics[2]?.value).toBe('1')
    expect(aggregated.metrics[3]?.label).toBe('Configured Builds')
    expect(aggregated.metrics[3]?.value).toBe('2')
    expect(aggregated.records).toContain('character names indexed: 3')
    expect(aggregated.records).toContain('character profiles loaded: 2')
    expect(aggregated.records).toContain('character build tab payloads: 2')
    expect(aggregated.records).toContain('configured character build tabs: 2')
    expect(aggregated.records).toContain('max-level characters: 1')
    expect(aggregated.records).toContain(
      'character display row: One | L80 Asura Elementalist (Male)',
    )
    expect(aggregated.records).toContain('character display row: Three | core profile pending')
  })

  it('aggregates wallet metrics from metadata and wallet balances', () => {
    const results: Gw2EndpointRunResult[] = [
      {
        endpointId: 'currency_metadata',
        section: 'Wallet',
        scope: 'public',
        mode: 'csvIds',
        ok: true,
        requestCount: 1,
        payload: [
          { id: 2, name: 'Karma' },
          { id: 1, name: 'Coin', icon: 'https://cdn.example.com/currency-1.png' },
        ],
      },
      {
        endpointId: 'account_wallet',
        section: 'Wallet',
        scope: 'account',
        mode: 'single',
        ok: true,
        requestCount: 1,
        payload: [
          [
            { id: 5, value: 301 },
            { id: 1, value: 50 },
          ],
        ],
      },
    ]

    const aggregated = aggregateWallet(results, true)

    expect(aggregated.state).toBe('available')
    expect(aggregated.metrics[0]?.label).toBe('Wallet Entries')
    expect(aggregated.metrics[0]?.value).toBe('2')
    expect(aggregated.metrics[0]?.tone).toBe('good')
    expect(aggregated.metrics[1]?.iconUrl).toBe('https://cdn.example.com/currency-1.png')
    expect(aggregated.metrics[1]?.badge).toBe('Mapped')
    expect(aggregated.summary).toContain('2 public currency definitions')
    expect(aggregated.records).toContain('currency metadata mapped: 2')
    expect(aggregated.records).toContain('wallet entries tracked: 2')
    expect(aggregated.records).toContain('currencies with account values: 1')
    expect(aggregated.records).toContain('currency id order preview: 1, 2')
    expect(aggregated.records).toContain('wallet id order preview: 1, 5')
    expect(aggregated.records).toContain('currency catalog preview: Coin, Karma')
    expect(aggregated.records).toContain('wallet display row: #1 Coin - 50')
    expect(aggregated.records).toContain('wallet display row: #2 Karma - n/a')
  })

  it('aggregates inventory metrics from item, character inventory, bank, and materials sources', () => {
    const results: Gw2EndpointRunResult[] = [
      {
        endpointId: 'inventory_item_details',
        section: 'Inventories',
        scope: 'public',
        mode: 'byId',
        ok: true,
        requestCount: 2,
        payload: [{ id: 1, icon: 'https://cdn.example.com/item-1.png' }, { id: 2 }, { id: 3 }],
      },
      {
        endpointId: 'character_inventory_snapshots',
        section: 'Inventories',
        scope: 'account',
        mode: 'expandFrom',
        ok: true,
        requestCount: 2,
        payload: [{ bagCount: 8 }, { bagCount: 9 }],
      },
      {
        endpointId: 'account_bank',
        section: 'Inventories',
        scope: 'account',
        mode: 'single',
        ok: true,
        requestCount: 1,
        payload: [[{ id: 19721, count: 5 }, null, { id: 46731, count: 250 }]],
      },
      {
        endpointId: 'bank_item_details',
        section: 'Inventories',
        scope: 'account',
        mode: 'csvFrom',
        ok: true,
        requestCount: 1,
        payload: [
          [
            { id: 19721, name: 'Copper Ore' },
            { id: 46731, name: 'Pouch of Auric Dust' },
          ],
        ],
      },
      {
        endpointId: 'materials_ids',
        section: 'Inventories',
        scope: 'public',
        mode: 'single',
        ok: true,
        requestCount: 1,
        payload: [[1, 2, 5]],
      },
      {
        endpointId: 'materials_categories',
        section: 'Inventories',
        scope: 'public',
        mode: 'csvFrom',
        ok: true,
        requestCount: 1,
        payload: [
          [
            { id: 1, name: 'Basic Crafting Materials', items: [12134, 12135, 12136] },
            { id: 2, name: 'Intermediate Materials', items: [24876, 24877] },
            { id: 5, name: 'Advanced Materials', items: [36060, 36061] },
          ],
        ],
      },
      {
        endpointId: 'materials_details',
        section: 'Inventories',
        scope: 'public',
        mode: 'csvFrom',
        ok: true,
        requestCount: 1,
        payload: [
          [
            { id: 12134, name: 'Iron Ore' },
            { id: 12135, name: 'Copper Ore' },
            { id: 24876, name: 'Ancient Inscribed Plank' },
          ],
        ],
      },
      {
        endpointId: 'account_materials',
        section: 'Inventories',
        scope: 'account',
        mode: 'single',
        ok: true,
        requestCount: 1,
        payload: [
          [
            { id: 12134, count: 100 },
            { id: 12135, count: 50 },
            { id: 24876, count: 0 },
          ],
        ],
      },
    ]

    const aggregated = aggregateInventories(results, true)

    expect(aggregated.state).toBe('available')
    expect(aggregated.metrics[1]?.label).toBe('Bank Occupied Slots')
    expect(aggregated.metrics[0]?.iconUrl).toBe('https://cdn.example.com/item-1.png')
    expect(aggregated.metrics[2]?.value).toBe('255')
    expect(aggregated.metrics[3]?.value).toBe('2')
    expect(aggregated.summary).toContain('Bank: 2 occupied slot')
    expect(aggregated.summary).toContain('Materials: 3 types tracked')
    expect(aggregated.records).toContain('inventory item details sampled: 3')
    expect(aggregated.records).toContain('character inventory payloads: 2')
    expect(aggregated.records).toContain('inventory containers sampled: 17')
    expect(aggregated.records).toContain('bank slots occupied: 2')
    expect(aggregated.records).toContain('bank stack total: 255')
    expect(aggregated.records).toContain('inventory bank row: #19721 Copper Ore x5')
    expect(aggregated.records).toContain('material categories loaded: 3')
    expect(aggregated.records).toContain('materials in catalog: 3')
    expect(aggregated.records).toContain('account materials tracked: 3')
    expect(aggregated.records).toContain('material stack total: 150')
    expect(aggregated.records).toContain('inventory material row: #12134 Iron Ore x100')
  })

  it('aggregates grouped account unlock metrics from catalog and account unlock sources', () => {
    const results: Gw2EndpointRunResult[] = [
      {
        endpointId: 'mini_catalog_details',
        section: 'Account Unlocks',
        scope: 'public',
        mode: 'csvFrom',
        ok: true,
        requestCount: 1,
        payload: [
          [
            { id: 1, name: 'Mini Rytlock' },
            { id: 2, name: 'Mini Caithe' },
          ],
        ],
      },
      {
        endpointId: 'account_mini_unlocks',
        section: 'Account Unlocks',
        scope: 'account',
        mode: 'single',
        ok: true,
        requestCount: 1,
        payload: [[2]],
      },
      {
        endpointId: 'skiff_details',
        section: 'Account Unlocks',
        scope: 'public',
        mode: 'csvFrom',
        ok: true,
        requestCount: 1,
        payload: [
          [
            { id: 11, name: 'Base Skiff' },
            { id: 12, name: 'Canthan Skiff' },
          ],
        ],
      },
      {
        endpointId: 'account_skiff_unlocks',
        section: 'Account Unlocks',
        scope: 'account',
        mode: 'single',
        ok: true,
        requestCount: 1,
        payload: [[11]],
      },
      {
        endpointId: 'account_upgrade_unlocks',
        section: 'Account Unlocks',
        scope: 'account',
        mode: 'single',
        ok: true,
        requestCount: 1,
        payload: [],
      },
      {
        endpointId: 'account_pvp_hero_unlocks',
        section: 'Account Unlocks',
        scope: 'account',
        mode: 'single',
        ok: true,
        requestCount: 1,
        payload: [],
      },
      {
        endpointId: 'account_emote_unlocks',
        section: 'Account Unlocks',
        scope: 'account',
        mode: 'single',
        ok: true,
        requestCount: 1,
        payload: [],
      },
      {
        endpointId: 'account_recipe_unlocks',
        section: 'Account Unlocks',
        scope: 'account',
        mode: 'single',
        ok: true,
        requestCount: 1,
        payload: [],
      },
    ]

    const aggregated = aggregateUnlocks(results, true)

    expect(aggregated.state).toBe('available')
    expect(aggregated.name).toBe('Account Unlocks')
    expect(aggregated.metrics[0]?.value).toBe('2')
    expect(aggregated.metrics[1]?.value).toBe('4')
    expect(aggregated.metrics[0]?.tone).toBe('good')
    expect(aggregated.metrics[2]?.badge).toBe('Cosmetic')
    expect(aggregated.metrics[3]?.badge).toBe('Feature')
    expect(aggregated.metrics.slice(4).map((metric) => metric.label)).toEqual([
      'Emotes Endpoint',
      'PvP Heroes Endpoint',
      'Recipes Endpoint',
      'Upgrades Endpoint',
    ])
    const upgradesMetric = aggregated.metrics.find((metric) => metric.label === 'Upgrades Endpoint')
    const pvpHeroesMetric = aggregated.metrics.find(
      (metric) => metric.label === 'PvP Heroes Endpoint',
    )
    const emotesMetric = aggregated.metrics.find((metric) => metric.label === 'Emotes Endpoint')
    const recipesMetric = aggregated.metrics.find((metric) => metric.label === 'Recipes Endpoint')

    expect(upgradesMetric?.value).toBe('Unavailable')
    expect(upgradesMetric?.badge).toBe('404-safe')
    expect(pvpHeroesMetric?.value).toBe('Unavailable')
    expect(pvpHeroesMetric?.badge).toBe('404-safe')
    expect(emotesMetric?.value).toBe('Unavailable')
    expect(emotesMetric?.badge).toBe('404-safe')
    expect(recipesMetric?.value).toBe('Unavailable')
    expect(recipesMetric?.badge).toBe('404-safe')
    expect(aggregated.summary).toContain('2/4 unlocks owned')
    expect(aggregated.records).toContain(
      'account unlock category: Miniatures | group=Cosmetic Unlocks | owned=1/2',
    )
    expect(aggregated.records).toContain(
      'account unlock category: Skiffs | group=Feature Unlocks | owned=1/2',
    )
    expect(
      aggregated.records.some((record) =>
        record.includes('account unlock display row: {"group":"Cosmetic Unlocks"'),
      ),
    ).toBe(true)
    expect(aggregated.records).toContain('account unlock endpoint status: upgrades=Unavailable')
    expect(aggregated.records).toContain('account unlock endpoint status: pvp-heroes=Unavailable')
    expect(aggregated.records).toContain('account unlock endpoint status: emotes=Unavailable')
    expect(aggregated.records).toContain('account unlock endpoint status: recipes=Unavailable')
  })

  it('emits attention semantics for zero-value calibrated metrics', () => {
    const results: Gw2EndpointRunResult[] = [
      {
        endpointId: 'account_wallet',
        section: 'Wallet',
        scope: 'account',
        mode: 'single',
        ok: true,
        requestCount: 1,
        payload: [[]],
      },
    ]

    const aggregated = aggregateWallet(results, true)

    expect(aggregated.state).toBe('available')
    expect(aggregated.metrics[0]?.value).toBe('0')
    expect(aggregated.metrics[0]?.tone).toBe('attention')
    expect(aggregated.metrics[0]?.badge).toBe('Needs Data')
    expect(aggregated.metrics[1]?.tone).toBe('attention')
    expect(aggregated.metrics[1]?.badge).toBe('Needs Data')
  })

  it('marks progression partial when endpoint errors exist', () => {
    const results: Gw2EndpointRunResult[] = [
      {
        endpointId: 'build_info',
        section: 'Progression',
        scope: 'public',
        mode: 'single',
        ok: true,
        requestCount: 1,
        payload: [{ value: 1 }],
      },
      {
        endpointId: 'account_progression',
        section: 'Progression',
        scope: 'account',
        mode: 'single',
        ok: true,
        requestCount: 1,
        payload: [
          { id: 'fractal_empowerment', value: 2 },
          { id: 'fractal_karmic_retribution', value: 2 },
        ],
      },
      {
        endpointId: 'account_luck',
        section: 'Progression',
        scope: 'account',
        mode: 'single',
        ok: true,
        requestCount: 1,
        payload: [{ id: 'luck', value: 4295449 }],
      },
      {
        endpointId: 'account_achievements_page',
        section: 'Progression',
        scope: 'account',
        mode: 'paged',
        ok: false,
        requestCount: 1,
        payload: [],
        error: 'rate limited',
      },
    ]

    const aggregated = aggregateProgression(results, true)

    expect(aggregated.state).toBe('partial')
    expect(aggregated.metrics).toHaveLength(7)
    expect(aggregated.metrics[1]?.label).toBe('Luck Consumed')
    expect(aggregated.metrics[1]?.value).toBe('4295449')
    expect(aggregated.metrics[2]?.badge).toBe('Tier 2')
    expect(aggregated.records).toContain('achievement entries sampled: 0')
    expect(aggregated.records).toContain('latest api build version observed: 1')
    expect(aggregated.records).toContain('luck consumed total: 4295449')
    expect(aggregated.records).toContain('progression display row: Luck Consumed - 4295449')
    expect(aggregated.records).toContain(
      'progression display row: Account Augmentation: Fractal Empowerment - Tier 2',
    )
    expect(aggregated.summary).toContain('Luck 4295449')
  })
})
