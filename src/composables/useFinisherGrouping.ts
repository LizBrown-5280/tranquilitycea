import type { Gw2UnlockDetailItem } from '@/types/gw2'

export function isPvpOrWvw(item: Gw2UnlockDetailItem): boolean {
  const relatedText =
    item.relatedItems
      ?.flatMap((relation) => relation.items)
      .map((relatedItem) => `${relatedItem.name} ${relatedItem.description ?? ''}`)
      .join(' ') ?? ''

  const haystack = [item.name, item.description, item.type, JSON.stringify(item.raw), relatedText]
    .join(' ')
    .toLowerCase()

  return (
    haystack.includes('pvp') ||
    haystack.includes('player vs player') ||
    haystack.includes('wvw') ||
    haystack.includes('world vs world') ||
    haystack.includes('world versus world')
  )
}

export function groupFinishers(items: Gw2UnlockDetailItem[]) {
  const GROUPS = [
    {
      label: 'Mordrem',
      matches: (item: Gw2UnlockDetailItem) => item.name.toLowerCase().includes('mordrem'),
    },
    {
      label: 'Place',
      matches: (item: Gw2UnlockDetailItem) =>
        item.name.toLowerCase().includes('place') &&
        !item.name.toLowerCase().includes('world tournament'),
    },
    {
      label: 'Rank',
      matches: (item: Gw2UnlockDetailItem) => item.name.toLowerCase().includes('rank'),
    },
    {
      label: 'World Tournament',
      matches: (item: Gw2UnlockDetailItem) => item.name.toLowerCase().includes('world tournament'),
    },
    { label: 'PvP & WvW', matches: isPvpOrWvw },
    { label: 'Other', matches: undefined },
  ]

  const grouped: { label: string; items: Gw2UnlockDetailItem[] }[] = GROUPS.map((group) => ({
    label: group.label,
    items: [],
  }))

  for (const item of items) {
    const fallbackGroup = GROUPS[GROUPS.length - 1] ?? { label: 'Other', matches: undefined }
    const matchedGroup = GROUPS.find((g) => g.matches && g.matches(item))
    const targetLabel = matchedGroup?.label ?? fallbackGroup.label
    const targetGroup = grouped.find((g) => g.label === targetLabel)
    if (targetGroup) {
      targetGroup.items.push(item)
    }
  }

  return grouped.filter((g) => g.items.length > 0)
}
