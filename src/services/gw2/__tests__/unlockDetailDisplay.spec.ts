import { describe, expect, it } from 'vitest'

import { buildUnlockDetailFields } from '@/services/gw2/unlockDetailDisplay'
import type { Gw2UnlockDetailItem } from '@/types/gw2'

describe('unlockDetailDisplay', () => {
  it('maps description to Info and includes shared item fields', () => {
    const item: Gw2UnlockDetailItem = {
      id: 1,
      name: 'Item',
      description: 'Item description',
      type: 'Armor',
      rarity: 'Rare',
      raw: {},
    }

    const fields = buildUnlockDetailFields(item)

    expect(fields).toEqual([
      { label: 'Info', value: 'Item description' },
      { label: 'Type', value: 'Armor' },
      { label: 'Rarity', value: 'Rare' },
    ])
  })

  it('includes vendor value as coin field when enabled', () => {
    const item: Gw2UnlockDetailItem = {
      id: 2,
      name: 'Vendor Item',
      vendorValue: 12034,
      raw: {},
    }

    const fields = buildUnlockDetailFields(item, undefined, {
      includeVendorValueAsCoin: true,
    })

    expect(fields).toEqual([
      {
        label: 'Vendor Value',
        value: '12034',
        coinValueInCopper: 12034,
      },
    ])
  })
})
