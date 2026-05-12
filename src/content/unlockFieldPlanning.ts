export interface UnlockFieldPlanningRow {
  property: string
  appliesTo: string
  source: string
  placement: string
  notes: string
}

export const unlockFieldPlanningRows: UnlockFieldPlanningRow[] = [
  {
    property: 'id',
    appliesTo: 'All unlock categories',
    source: 'Catalog + Account',
    placement: 'Hover',
    notes: 'Primary key used to match catalog entries with account unlock entries.',
  },
  {
    property: 'name',
    appliesTo: 'All unlock categories',
    source: 'Catalog',
    placement: 'Tile + Hover',
    notes: 'Main display label for tile context and hover title.',
  },
  {
    property: 'description',
    appliesTo: 'Most unlock categories',
    source: 'Catalog',
    placement: 'Hover',
    notes: 'Long-form text remains in hover to keep grid compact.',
  },
  {
    property: 'icon',
    appliesTo: 'All unlock categories',
    source: 'Catalog',
    placement: 'Tile',
    notes: 'Thumbnail image source for the main visual.',
  },
  {
    property: 'owned state',
    appliesTo: 'All unlock categories',
    source: 'Account (via ID match)',
    placement: 'Tile state',
    notes: 'Controls dim/bright treatment for locked vs owned items.',
  },
  {
    property: 'permanent',
    appliesTo: 'Finishers (known)',
    source: 'Account',
    placement: 'Hover',
    notes: 'Account-side finisher property; useful for status details.',
  },
  {
    property: 'quantity',
    appliesTo: 'Finishers (known)',
    source: 'Account',
    placement: 'Hover (candidate: bottom box)',
    notes: 'Candidate for the bottom box once cross-category rules are finalized.',
  },
  {
    property: 'cost',
    appliesTo: 'TBD per category',
    source: 'TBD',
    placement: 'Bottom box',
    notes: 'Reserved slot under thumbnail. Waiting on data source and format rules.',
  },
]
