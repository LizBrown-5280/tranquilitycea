/**
 * Aggregator for mount skins organized by mount type.
 * Groups flat skin catalog by mount type and resolves dye slot colors.
 */

import { flattenPayloadEntries, getSectionResults } from '@/services/gw2/aggregators/helpers'
import { parseUnlockIds } from '@/services/gw2/payloadParsers'
import type {
  Gw2EndpointRunResult,
  Gw2MountType,
  Gw2MountSkin,
  Gw2MountDyeSlot,
  Gw2MountsOrganized,
} from '@/types/gw2'

interface MountTypeRaw extends Record<string, unknown> {
  id?: string
  name?: string
  default_skin?: number
  skins?: number[]
}

interface MountSkinRaw extends Record<string, unknown> {
  id?: number
  name?: string
  icon?: string
  dye_slots?: number[]
}

interface DyeColorRaw extends Record<string, unknown> {
  id?: number
  name?: string
}

/**
 * Builds a map of dye color ID to color name for quick lookup.
 */
function buildDyeColorMap(dyeCatalogEntries: DyeColorRaw[]): Map<number, string> {
  const dyeMap = new Map<number, string>()

  for (const dye of dyeCatalogEntries) {
    if (typeof dye.id === 'number' && typeof dye.name === 'string') {
      dyeMap.set(dye.id, dye.name)
    }
  }

  return dyeMap
}

/**
 * Builds a map of skin ID to skin details for quick lookup.
 */
function buildSkinDetailsMap(
  skinCatalogEntries: MountSkinRaw[],
  ownedSkinIds: Set<number>,
  dyeColorMap: Map<number, string>,
): Map<number, Gw2MountSkin> {
  const skinMap = new Map<number, Gw2MountSkin>()

  for (const skin of skinCatalogEntries) {
    if (typeof skin.id !== 'number' || typeof skin.name !== 'string') {
      continue
    }

    skinMap.set(skin.id, {
      id: skin.id,
      name: skin.name,
      icon: typeof skin.icon === 'string' ? skin.icon : undefined,
      owned: ownedSkinIds.has(skin.id),
    })
  }

  return skinMap
}

/**
 * Organizes mount skins by mount type and resolves all cross-references.
 * Returns data grouped by type with computed totals.
 */
export function buildMountsByType(allResults: Gw2EndpointRunResult[]): Gw2MountsOrganized {
  const sectionResults = getSectionResults('Account Unlocks', allResults)

  // Extract payloads from relevant endpoints
  const mountTypesResult = sectionResults.find((r) => r.endpointId === 'mount_types')
  const mountSkinDetailsResult = sectionResults.find((r) => r.endpointId === 'mount_skin_details')
  const dyeCatalogDetailsResult = sectionResults.find((r) => r.endpointId === 'dye_catalog_details')
  const accountMountSkinsResult = sectionResults.find(
    (r) => r.endpointId === 'account_mount_skin_unlocks',
  )

  const mountTypes = flattenPayloadEntries(
    mountTypesResult ? mountTypesResult.payload : [],
  ) as MountTypeRaw[]
  const mountSkins = flattenPayloadEntries(
    mountSkinDetailsResult ? mountSkinDetailsResult.payload : [],
  ) as MountSkinRaw[]
  const dyeColors = flattenPayloadEntries(
    dyeCatalogDetailsResult ? dyeCatalogDetailsResult.payload : [],
  ) as DyeColorRaw[]

  // parseUnlockIds returns string[], so convert to Set<number>
  const ownedSkinIdStrings = parseUnlockIds(
    accountMountSkinsResult ? flattenPayloadEntries(accountMountSkinsResult.payload) : [],
  )
  const ownedSkinIds = new Set<number>(
    ownedSkinIdStrings
      .map((id) => {
        const num = parseInt(id, 10)
        return isNaN(num) ? -1 : num
      })
      .filter((num) => num !== -1),
  )

  // Build lookup maps
  const dyeColorMap = buildDyeColorMap(dyeColors)
  const skinDetailsMap = buildSkinDetailsMap(mountSkins, ownedSkinIds, dyeColorMap)

  // Organize mount types with their skins
  const organizedTypes: Gw2MountType[] = []
  let totalSkins = 0
  let ownedSkins = 0

  for (const mountType of mountTypes) {
    if (typeof mountType.id !== 'string' || typeof mountType.name !== 'string') {
      continue
    }

    const typeSkinsArray: Gw2MountSkin[] = []

    if (Array.isArray(mountType.skins)) {
      for (const skinId of mountType.skins) {
        if (typeof skinId === 'number') {
          const skinDetail = skinDetailsMap.get(skinId)
          if (skinDetail) {
            typeSkinsArray.push(skinDetail)
            totalSkins += 1
            if (skinDetail.owned) {
              ownedSkins += 1
            }
          }
        }
      }
    }

    // Only add types that have skins
    if (typeSkinsArray.length > 0) {
      organizedTypes.push({
        id: mountType.id,
        name: mountType.name,
        defaultSkinId:
          typeof mountType.default_skin === 'number' ? mountType.default_skin : undefined,
        skins: typeSkinsArray,
      })
    }
  }

  return {
    byType: organizedTypes,
    totalSkins,
    ownedSkins,
  }
}
