interface BaseIconEntity {
  icon?: string
  iconUrl?: string
  icon_url?: string
  icon_big?: string
}

export interface Gw2CharacterProfile extends BaseIconEntity {
  name: string
  race?: string
  gender?: string
  profession?: string
  level?: number
  guild?: string
  age?: number
  deaths?: number
  created?: string
  last_modified?: string
  title?: number
}

export interface Gw2CurrencyMetadata extends BaseIconEntity {
  id: number
  name?: string
  description?: string
  order?: number
}

export interface Gw2WalletEntry {
  id: number
  value: number
}

export interface Gw2BankSlotEntry {
  id: number
  count: number
}

export interface Gw2MaterialCategoryEntry {
  id: number
  name?: string
  items?: number[]
  order?: number
}

export interface Gw2AccountMaterialEntry {
  id: number
  category?: number
  binding?: string
  count: number
}

export interface Gw2ItemDetail extends BaseIconEntity {
  id: number
  name?: string
  upgrades_into?: number[]
  upgrades_from?: number[]
}

export interface Gw2RecipeDetail extends BaseIconEntity {
  id: number
}

export interface Gw2BuildVersion {
  value: number
}

export interface Gw2ProfessionDetail extends BaseIconEntity {
  id: string
}

export type Gw2ObjectEntry = Record<string, unknown>

export interface Gw2AccountOverview extends Gw2ObjectEntry {
  id?: string
  name?: string
  world?: number
}

export interface Gw2BuildTabPayload extends Gw2ObjectEntry {
  tab?: number
}

export interface Gw2CharacterInventorySnapshot extends Gw2ObjectEntry {
  bags?: unknown[]
}

export interface Gw2MasteryPointsPayload extends Gw2ObjectEntry {
  totals?: unknown[]
  unlocked?: unknown[]
}

export interface Gw2AchievementEntry extends Gw2ObjectEntry {
  id: number
}

export interface Gw2AccountProgressionEntry {
  id: string
  value: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getStringField(value: Record<string, unknown>, key: string): string | undefined {
  const field = value[key]
  return typeof field === 'string' ? field : undefined
}

function getNumberField(value: Record<string, unknown>, key: string): number | undefined {
  const field = value[key]
  return typeof field === 'number' ? field : undefined
}

function getNumberArrayField(value: Record<string, unknown>, key: string): number[] | undefined {
  const field = value[key]
  if (!Array.isArray(field)) {
    return undefined
  }

  return field.filter((entry): entry is number => typeof entry === 'number')
}

export function parseCharacterNames(entries: unknown[]): string[] {
  return entries.filter((entry): entry is string => typeof entry === 'string')
}

export function parseBuildVersions(entries: unknown[]): Gw2BuildVersion[] {
  const versions: Gw2BuildVersion[] = []

  for (const entry of entries) {
    if (typeof entry === 'number') {
      versions.push({ value: entry })
    }
  }

  return versions
}

export function parseProfessionDetails(entries: unknown[]): Gw2ProfessionDetail[] {
  const professions: Gw2ProfessionDetail[] = []

  for (const entry of entries) {
    if (!isRecord(entry)) {
      continue
    }

    const id = getStringField(entry, 'id')
    if (!id) {
      continue
    }

    const profession: Gw2ProfessionDetail = { id }
    const icon = getStringField(entry, 'icon')
    const iconUrl = getStringField(entry, 'iconUrl') ?? getStringField(entry, 'icon_url')

    if (icon) {
      profession.icon = icon
    }
    if (iconUrl) {
      profession.iconUrl = iconUrl
    }

    professions.push(profession)
  }

  return professions
}

export function parseObjectEntries(entries: unknown[]): Gw2ObjectEntry[] {
  const objects: Gw2ObjectEntry[] = []

  for (const entry of entries) {
    if (isRecord(entry)) {
      objects.push(entry)
    }
  }

  return objects
}

export function parseAccountOverview(entries: unknown[]): Gw2AccountOverview[] {
  const overviews: Gw2AccountOverview[] = []

  for (const entry of entries) {
    if (!isRecord(entry)) {
      continue
    }

    overviews.push(entry)
  }

  return overviews
}

export function parseBuildTabPayloads(entries: unknown[]): Gw2BuildTabPayload[] {
  const payloads: Gw2BuildTabPayload[] = []

  for (const entry of entries) {
    if (!isRecord(entry)) {
      continue
    }

    payloads.push(entry)
  }

  return payloads
}

export function parseCharacterInventorySnapshots(
  entries: unknown[],
): Gw2CharacterInventorySnapshot[] {
  const snapshots: Gw2CharacterInventorySnapshot[] = []

  for (const entry of entries) {
    if (!isRecord(entry)) {
      continue
    }

    snapshots.push(entry)
  }

  return snapshots
}

export function parseMasteryPointsPayloads(entries: unknown[]): Gw2MasteryPointsPayload[] {
  const payloads: Gw2MasteryPointsPayload[] = []

  for (const entry of entries) {
    if (!isRecord(entry)) {
      continue
    }

    payloads.push(entry)
  }

  return payloads
}

export function parseAchievementEntries(entries: unknown[]): Gw2AchievementEntry[] {
  const achievements: Gw2AchievementEntry[] = []

  for (const entry of entries) {
    if (!isRecord(entry)) {
      continue
    }

    const id = getNumberField(entry, 'id')
    if (id === undefined) {
      continue
    }

    achievements.push({
      ...entry,
      id,
    })
  }

  return achievements
}

export function parseAccountProgressionEntries(entries: unknown[]): Gw2AccountProgressionEntry[] {
  const progressionEntries: Gw2AccountProgressionEntry[] = []

  for (const entry of entries) {
    if (!isRecord(entry)) {
      continue
    }

    const id = getStringField(entry, 'id')
    const value = getNumberField(entry, 'value')

    if (!id || value === undefined) {
      continue
    }

    progressionEntries.push({ id, value })
  }

  return progressionEntries
}

export function parseCharacterProfiles(entries: unknown[]): Gw2CharacterProfile[] {
  const profiles: Gw2CharacterProfile[] = []

  for (const entry of entries) {
    if (!isRecord(entry)) {
      continue
    }

    const name = getStringField(entry, 'name')
    if (!name) {
      continue
    }

    const profile: Gw2CharacterProfile = { name }
    const race = getStringField(entry, 'race')
    const gender = getStringField(entry, 'gender')
    const profession = getStringField(entry, 'profession')
    const guild = getStringField(entry, 'guild')
    const created = getStringField(entry, 'created')
    const lastModified = getStringField(entry, 'last_modified')
    const level = getNumberField(entry, 'level')
    const age = getNumberField(entry, 'age')
    const deaths = getNumberField(entry, 'deaths')
    const title = getNumberField(entry, 'title')
    const icon = getStringField(entry, 'icon')
    const iconUrl = getStringField(entry, 'iconUrl') ?? getStringField(entry, 'icon_url')

    if (race) {
      profile.race = race
    }
    if (gender) {
      profile.gender = gender
    }
    if (profession) {
      profile.profession = profession
    }
    if (guild) {
      profile.guild = guild
    }
    if (created) {
      profile.created = created
    }
    if (lastModified) {
      profile.last_modified = lastModified
    }
    if (level !== undefined) {
      profile.level = level
    }
    if (age !== undefined) {
      profile.age = age
    }
    if (deaths !== undefined) {
      profile.deaths = deaths
    }
    if (title !== undefined) {
      profile.title = title
    }
    if (icon) {
      profile.icon = icon
    }
    if (iconUrl) {
      profile.iconUrl = iconUrl
    }

    profiles.push(profile)
  }

  return profiles
}

export function parseCurrencyMetadata(entries: unknown[]): Gw2CurrencyMetadata[] {
  const currencies: Gw2CurrencyMetadata[] = []

  for (const entry of entries) {
    if (!isRecord(entry)) {
      continue
    }

    const id = getNumberField(entry, 'id')
    if (id === undefined) {
      continue
    }

    const currency: Gw2CurrencyMetadata = { id }
    const name = getStringField(entry, 'name')
    const description = getStringField(entry, 'description')
    const order = getNumberField(entry, 'order')
    const icon = getStringField(entry, 'icon')
    const iconUrl = getStringField(entry, 'iconUrl') ?? getStringField(entry, 'icon_url')
    const iconBig = getStringField(entry, 'icon_big')
    const upgradesInto = getNumberArrayField(entry, 'upgrades_into')
    const upgradesFrom = getNumberArrayField(entry, 'upgrades_from')

    if (name) {
      currency.name = name
    }
    if (description) {
      currency.description = description
    }
    if (order !== undefined) {
      currency.order = order
    }
    if (icon) {
      currency.icon = icon
    }
    if (iconUrl) {
      currency.iconUrl = iconUrl
    }
    if (iconBig) {
      currency.icon_big = iconBig
    }

    currencies.push(currency)
  }

  return currencies
}

export function parseWalletEntries(entries: unknown[]): Gw2WalletEntry[] {
  return entries
    .filter((entry): entry is Record<string, unknown> => isRecord(entry))
    .map((entry) => {
      const id = getNumberField(entry, 'id')
      const value = getNumberField(entry, 'value')

      if (id === undefined || value === undefined) {
        return undefined
      }

      return { id, value }
    })
    .filter((entry): entry is Gw2WalletEntry => entry !== undefined)
}

export function parseBankSlotEntries(entries: unknown[]): Gw2BankSlotEntry[] {
  const bankSlots: Gw2BankSlotEntry[] = []

  for (const entry of entries) {
    if (!isRecord(entry)) {
      continue
    }

    const id = getNumberField(entry, 'id')
    const count = getNumberField(entry, 'count')

    if (id === undefined || count === undefined) {
      continue
    }

    bankSlots.push({ id, count })
  }

  return bankSlots
}

export function parseItemDetails(entries: unknown[]): Gw2ItemDetail[] {
  const items: Gw2ItemDetail[] = []

  for (const entry of entries) {
    if (!isRecord(entry)) {
      continue
    }

    const id = getNumberField(entry, 'id')
    if (id === undefined) {
      continue
    }

    const item: Gw2ItemDetail = { id }
    const name = getStringField(entry, 'name')
    const icon = getStringField(entry, 'icon')
    const iconUrl = getStringField(entry, 'iconUrl') ?? getStringField(entry, 'icon_url')
    const iconBig = getStringField(entry, 'icon_big')
    const upgradesInto = getNumberArrayField(entry, 'upgrades_into')
    const upgradesFrom = getNumberArrayField(entry, 'upgrades_from')

    if (name) {
      item.name = name
    }
    if (icon) {
      item.icon = icon
    }
    if (iconUrl) {
      item.iconUrl = iconUrl
    }
    if (iconBig) {
      item.icon_big = iconBig
    }
    if (upgradesInto && upgradesInto.length > 0) {
      item.upgrades_into = upgradesInto
    }
    if (upgradesFrom && upgradesFrom.length > 0) {
      item.upgrades_from = upgradesFrom
    }

    items.push(item)
  }

  return items
}

export function parseMaterialCategoryEntries(entries: unknown[]): Gw2MaterialCategoryEntry[] {
  const categories: Gw2MaterialCategoryEntry[] = []

  for (const entry of entries) {
    if (!isRecord(entry)) {
      continue
    }

    const id = getNumberField(entry, 'id')
    if (id === undefined) {
      continue
    }

    const category: Gw2MaterialCategoryEntry = { id }
    const name = getStringField(entry, 'name')
    const order = getNumberField(entry, 'order')
    const items = entry.items
    if (Array.isArray(items)) {
      category.items = items.filter((item): item is number => typeof item === 'number')
    }

    if (name) {
      category.name = name
    }
    if (order !== undefined) {
      category.order = order
    }

    categories.push(category)
  }

  return categories
}

export function parseAccountMaterialEntries(entries: unknown[]): Gw2AccountMaterialEntry[] {
  const materials: Gw2AccountMaterialEntry[] = []

  for (const entry of entries) {
    if (!isRecord(entry)) {
      continue
    }

    const id = getNumberField(entry, 'id')
    const count = getNumberField(entry, 'count')

    if (id === undefined || count === undefined) {
      continue
    }

    const material: Gw2AccountMaterialEntry = { id, count }
    const category = getNumberField(entry, 'category')
    const binding = getStringField(entry, 'binding')

    if (category !== undefined) {
      material.category = category
    }
    if (binding) {
      material.binding = binding
    }

    materials.push(material)
  }

  return materials
}

export function parseRecipeDetails(entries: unknown[]): Gw2RecipeDetail[] {
  const recipes: Gw2RecipeDetail[] = []

  for (const entry of entries) {
    if (!isRecord(entry)) {
      continue
    }

    const id = getNumberField(entry, 'id')
    if (id === undefined) {
      continue
    }

    const recipe: Gw2RecipeDetail = { id }
    const icon = getStringField(entry, 'icon')
    const iconUrl = getStringField(entry, 'iconUrl') ?? getStringField(entry, 'icon_url')

    if (icon) {
      recipe.icon = icon
    }
    if (iconUrl) {
      recipe.iconUrl = iconUrl
    }

    recipes.push(recipe)
  }

  return recipes
}

export function parseNumericIds(entries: unknown[]): number[] {
  return entries.filter((entry): entry is number => typeof entry === 'number')
}

export function parseUnlockIds(entries: unknown[]): string[] {
  const ids = new Set<string>()

  for (const entry of entries) {
    if (typeof entry === 'number' || typeof entry === 'string') {
      ids.add(String(entry))
      continue
    }

    if (!isRecord(entry)) {
      continue
    }

    const rawId = entry.id
    if (typeof rawId === 'number' || typeof rawId === 'string') {
      ids.add(String(rawId))
    }
  }

  return Array.from(ids)
}
