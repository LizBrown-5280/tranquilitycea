/**
 * Converts unified Gw2UnlockDetailItem to UnlockDetailField[] for display in HoverCard.
 * Handles the shared structure (title, description) plus category-specific fields,
 * and formats related items into readable sections.
 */

import { sanitizeGw2Text } from '@/services/gw2/unlockCategoryViewModel'
import type { Gw2UnlockDetailItem } from '@/types/gw2'
import type { UnlockDetailField } from '@/services/gw2/unlockCategoryViewModel'

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'string') {
    return sanitizeGw2Text(value)
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  if (Array.isArray(value)) {
    return value.map((v) => formatValue(v)).join(', ')
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

/**
 * Converts a unified detail item to hover card display fields.
 * Includes common fields like type/rarity, related items, and optional category-specific fields.
 */
export function buildUnlockDetailFields(
  item: Gw2UnlockDetailItem,
  categorySpecificFields?: Array<{ key: string; label: string }>,
  options?: {
    includeDescription?: boolean
    maxRelatedPerSection?: number
    includeVendorValueAsCoin?: boolean
  },
): UnlockDetailField[] {
  const fields: UnlockDetailField[] = []
  const maxRelated = options?.maxRelatedPerSection ?? 5
  const includeVendorValueAsCoin = options?.includeVendorValueAsCoin ?? false

  // Add description if present
  if ((options?.includeDescription ?? true) && item.description) {
    fields.push({ label: 'Info', value: item.description })
  }

  // Add common item fields
  if (item.type) {
    fields.push({ label: 'Type', value: item.type })
  }

  if (item.rarity) {
    fields.push({ label: 'Rarity', value: item.rarity })
  }

  if (item.level !== undefined) {
    fields.push({ label: 'Level', value: String(item.level) })
  }

  if (includeVendorValueAsCoin && item.vendorValue !== undefined) {
    fields.push({
      label: 'Vendor Value',
      value: String(item.vendorValue),
      coinValueInCopper: item.vendorValue,
    })
  }

  if (item.accountRaw) {
    fields.push({ label: 'Account Bound', value: 'Account bound', emphasis: true })
  }

  // Add related items as structured sections
  if (item.relatedItems && item.relatedItems.length > 0) {
    for (const relation of item.relatedItems) {
      const itemsToShow = relation.items.slice(0, maxRelated)

      for (const related of itemsToShow) {
        fields.push({
          label: 'Item',
          value: `${related.name}`,
        })

        if (related.description) {
          fields.push({
            label: 'Info',
            value: related.description,
          })
        }

        if (related.type) {
          fields.push({
            label: 'Type',
            value: related.type,
          })
        }

        if (related.rarity) {
          fields.push({
            label: 'Rarity',
            value: related.rarity,
          })
        }

        if (includeVendorValueAsCoin && related.vendorValue !== undefined) {
          fields.push({
            label: 'Vendor Value',
            value: String(related.vendorValue),
            coinValueInCopper: related.vendorValue,
          })
        }
      }

      if (relation.items.length > maxRelated) {
        fields.push({
          label: 'More',
          value: `+${relation.items.length - maxRelated} more`,
        })
      }
    }
  }

  // Add category-specific fields
  if (categorySpecificFields && categorySpecificFields.length > 0) {
    for (const field of categorySpecificFields) {
      const value = item.raw[field.key]
      if (value !== null && value !== undefined) {
        const formatted = formatValue(value)
        if (formatted) {
          fields.push({ label: field.label, value: formatted })
        }
      }
    }
  }

  return fields
}
