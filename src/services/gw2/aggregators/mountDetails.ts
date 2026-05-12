/**
 * Aggregator for mount skin unlock details with unified hover model.
 * Currently mounts don't have additional related items fetched, but the builder
 * pattern is set up for future expansion.
 */

import { buildUnlockCategoryItems } from '@/services/gw2/unlockCategoryViewModel'
import { buildUnlockDetailItem } from '@/services/gw2/unlockDetailBuilder'
import type { Gw2UnlockDetailItem } from '@/types/gw2'
import type { Gw2EndpointRunResult } from '@/types/gw2'

/**
 * Builds mount skin detail items using the unified hover model.
 * Future: can be expanded to include dye slot unlocks or other related items.
 */
export function buildMountDetailsWithRelations(
  allResults: Gw2EndpointRunResult[],
): Gw2UnlockDetailItem[] {
  const mountCatalog = buildUnlockCategoryItems(allResults, {
    title: 'Mounts',
    catalogEndpoint: 'mount_skin_details',
    accountEndpoint: 'account_mount_skin_unlocks',
  })

  // Convert each mount to unified detail item
  // For now, no relations are configured since mount-related details aren't currently fetched
  return mountCatalog.map((mount) => buildUnlockDetailItem(mount.raw as Record<string, unknown>))
}
