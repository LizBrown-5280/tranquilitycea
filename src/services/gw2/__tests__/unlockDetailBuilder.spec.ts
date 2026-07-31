import { describe, expect, it } from 'vitest'

import {
  buildItemDetailsCache,
  buildUnlockDetailItem,
  extractRelatedItemIds,
} from '@/services/gw2/unlockDetailBuilder'
import type { Gw2UnlockDetailItem } from '@/types/gw2'

describe('unlockDetailBuilder', () => {
  it('extracts numeric IDs from various field types', () => {
    expect(extractRelatedItemIds(123)).toEqual([123])
    expect(extractRelatedItemIds([1, 2, 3])).toEqual([1, 2, 3])
    expect(extractRelatedItemIds([1, [2, 3]])).toEqual([1, 2, 3])
    expect(extractRelatedItemIds(null)).toEqual([])
    expect(extractRelatedItemIds(undefined)).toEqual([])
  })

  it('builds item cache from array of item entries', () => {
    const entries = [
      { id: 1, name: 'Item One' },
      { id: 2, name: 'Item Two' },
      { id: 3, name: 'Item Three' },
    ]

    const cache = buildItemDetailsCache(entries as unknown[])

    expect(cache.byId.size).toBe(3)
    expect(cache.byId.get(1)?.name).toBe('Item One')
    expect(cache.byId.get(2)?.name).toBe('Item Two')
    expect(cache.byId.get(3)?.name).toBe('Item Three')
  })

  it('normalizes item basics (name, description, icon, type, rarity, level)', () => {
    const entry = {
      id: 123,
      name: 'Test Item',
      description: 'A test item',
      icon: 'https://example.com/icon.png',
      type: 'armor',
      rarity: 'rare',
      level: 80,
      vendor_value: 12345,
    }

    const item = buildUnlockDetailItem(entry)

    expect(item.id).toBe(123)
    expect(item.name).toBe('Test Item')
    expect(item.description).toBe('A test item')
    expect(item.iconUrl).toBe('https://example.com/icon.png')
    expect(item.type).toBe('armor')
    expect(item.rarity).toBe('rare')
    expect(item.level).toBe(80)
    expect(item.vendorValue).toBe(12345)
  })

  it('resolves related items when relation configs are provided', () => {
    const catalogEntry = {
      id: 1,
      name: 'Finisher',
      unlock_items: [100, 101],
    }

    const relatedItemsCache = buildItemDetailsCache([
      { id: 100, name: 'Related Item 1' },
      { id: 101, name: 'Related Item 2' },
      { id: 102, name: 'Unrelated Item' },
    ] as unknown[])

    const item = buildUnlockDetailItem(catalogEntry, [
      {
        relationName: 'Unlock Items',
        sourceField: 'unlock_items',
        itemsCache: relatedItemsCache,
      },
    ])

    const related = item.relatedItems?.[0]
    expect(item.relatedItems).toBeDefined()
    expect(item.relatedItems?.length).toBe(1)
    expect(related?.relationName).toBe('Unlock Items')
    expect(related?.items.length).toBe(2)
    expect(related?.items[0]?.name).toBe('Related Item 1')
    expect(related?.items[1]?.name).toBe('Related Item 2')
  })

  it('handles multiple relation configs', () => {
    const catalogEntry = {
      id: 1,
      name: 'Multi-Relation Item',
      field_a: [100, 101],
      field_b: [200],
    }

    const cacheA = buildItemDetailsCache([
      { id: 100, name: 'Type A - 1' },
      { id: 101, name: 'Type A - 2' },
    ] as unknown[])

    const cacheB = buildItemDetailsCache([{ id: 200, name: 'Type B - 1' }] as unknown[])

    const item = buildUnlockDetailItem(catalogEntry, [
      { relationName: 'Type A', sourceField: 'field_a', itemsCache: cacheA },
      { relationName: 'Type B', sourceField: 'field_b', itemsCache: cacheB },
    ])

    expect(item.relatedItems?.length).toBe(2)
    expect(item.relatedItems?.[0]?.relationName).toBe('Type A')
    expect(item.relatedItems?.[0]?.items.length).toBe(2)
    expect(item.relatedItems?.[1]?.relationName).toBe('Type B')
    expect(item.relatedItems?.[1]?.items.length).toBe(1)
  })

  it('ignores missing related items gracefully', () => {
    const catalogEntry = {
      id: 1,
      name: 'Item with Missing Relations',
      unlock_items: [100, 999], // 999 doesn't exist in cache
    }

    const cache = buildItemDetailsCache([{ id: 100, name: 'Exists' }] as unknown[])

    const item = buildUnlockDetailItem(catalogEntry, [
      { relationName: 'Items', sourceField: 'unlock_items', itemsCache: cache },
    ])

    // Should still have the relation even if one item is missing
    expect(item.relatedItems?.length).toBe(1)
    expect(item.relatedItems?.[0]?.items.length).toBe(1)
    expect(item.relatedItems?.[0]?.items[0]?.name).toBe('Exists')
  })

  it('sanitizes HTML from text fields', () => {
    const entry = {
      id: 1,
      name: 'Item <c=@reminder>with<br/>HTML</c>',
      description: '<c=@special>Description</c>',
    }

    const item = buildUnlockDetailItem(entry)

    // HTML tags should be stripped
    expect(item.name).not.toContain('<')
    expect(item.description).not.toContain('<')
    expect(item.name).toContain('Item')
    expect(item.name).toContain('HTML')
  })
})
