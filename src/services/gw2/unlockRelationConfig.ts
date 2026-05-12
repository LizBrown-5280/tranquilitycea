/**
 * Configuration for multi-level unlock item graph traversal.
 * Defines which fields in unlock catalog entries contain references to related items,
 * and how those related items should be fetched and traversed.
 */

export interface RelationFieldConfig {
  /** The field name in the unlock item to extract IDs from */
  sourceField: string
  /** The endpoint path to fetch these related items from */
  targetPath: string
  /** Endpoint ID to use for this relation (e.g., 'finisher_unlock_item_details') */
  endpointId: string
  /** Whether to recursively expand this result (via csvGraphFrom) */
  expandRelated: boolean
  /** Max depth for graph expansion from this relation */
  maxDepth: number
}

export interface UnlockCategoryRelationConfig {
  /** Category identifier (e.g., 'finishers', 'mounts') */
  categoryId: string
  /** Catalog endpoint ID (e.g., 'finisher_details') */
  catalogEndpoint: string
  /** Account unlock endpoint ID (e.g., 'account_finisher_unlocks') */
  accountEndpoint: string
  /** Related item fields to traverse and their fetch configs */
  relations: RelationFieldConfig[]
}

/**
 * Extracts numeric IDs from a field in an unlock item.
 * Returns all numeric values found in the field (handles both direct numbers and nested arrays).
 */
export function extractNumericIds(value: unknown): number[] {
  const ids: number[] = []

  function traverse(val: unknown) {
    if (typeof val === 'number') {
      ids.push(val)
    } else if (Array.isArray(val)) {
      for (const entry of val) {
        traverse(entry)
      }
    } else if (typeof val === 'object' && val !== null) {
      const record = val as Record<string, unknown>
      for (const key in record) {
        traverse(record[key])
      }
    }
  }

  traverse(value)
  return ids
}

/**
 * Creates an extractIds function for csvGraphFrom mode that respects
 * a specific source field in the unlock item payload.
 */
export function createRelationExtractor(sourceField: string) {
  return (dependencyPayload: unknown[]) => {
    const ids = new Set<number>()

    for (const payloadEntry of dependencyPayload) {
      if (!Array.isArray(payloadEntry)) {
        continue
      }

      for (const item of payloadEntry) {
        if (typeof item !== 'object' || item === null) {
          continue
        }

        const record = item as Record<string, unknown>
        const fieldValue = record[sourceField]
        if (fieldValue !== undefined) {
          extractNumericIds(fieldValue).forEach((id) => ids.add(id))
        }
      }
    }

    return Array.from(ids)
  }
}

/**
 * Configuration for unlock categories with configurable graph expansion.
 * When a category is added here, the endpoint manifest and orchestrator
 * will automatically create the necessary endpoints and traversal rules.
 */
export const UNLOCK_CATEGORY_RELATIONS: UnlockCategoryRelationConfig[] = [
  {
    categoryId: 'finishers',
    catalogEndpoint: 'finisher_details',
    accountEndpoint: 'account_finisher_unlocks',
    relations: [
      {
        sourceField: 'unlock_items',
        targetPath: '/v2/items',
        endpointId: 'finisher_unlock_item_details',
        expandRelated: true,
        maxDepth: 4,
      },
    ],
  },
  {
    categoryId: 'mounts',
    catalogEndpoint: 'mount_skin_details',
    accountEndpoint: 'account_mount_skin_unlocks',
    relations: [
      {
        sourceField: 'dye_slot_unlocks',
        targetPath: '/v2/dyes',
        endpointId: 'mount_dye_slot_details',
        expandRelated: false,
        maxDepth: 1,
      },
    ],
  },
]

/**
 * Resolves the relation config for a given category.
 */
export function getUnlockCategoryRelations(
  categoryId: string,
): UnlockCategoryRelationConfig | undefined {
  return UNLOCK_CATEGORY_RELATIONS.find((config) => config.categoryId === categoryId)
}
