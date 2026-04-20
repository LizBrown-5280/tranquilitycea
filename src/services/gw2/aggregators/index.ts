import { aggregateCharacters } from '@/services/gw2/aggregators/characters'
import { createInitialSection } from '@/services/gw2/aggregators/helpers'
import { aggregateInventories } from '@/services/gw2/aggregators/inventories'
import { aggregateProgression } from '@/services/gw2/aggregators/progression'
import { aggregateUnlocks } from '@/services/gw2/aggregators/unlocks'
import { aggregateWallet } from '@/services/gw2/aggregators/wallet'
import type { Gw2BootstrapState, Gw2EndpointRunResult } from '@/types/gw2'

export function aggregateAllSections(
  allResults: Gw2EndpointRunResult[],
  hasKey: boolean,
): Gw2BootstrapState['sections'] {
  return {
    Characters: aggregateCharacters(allResults, hasKey),
    Inventories: aggregateInventories(allResults, hasKey),
    'Account Unlocks': aggregateUnlocks(allResults, hasKey),
    Wallet: aggregateWallet(allResults, hasKey),
    Progression: aggregateProgression(allResults, hasKey),
  }
}

export function createInitialSections(): Gw2BootstrapState['sections'] {
  return {
    Characters: createInitialSection('Characters'),
    Inventories: createInitialSection('Inventories'),
    'Account Unlocks': createInitialSection('Account Unlocks'),
    Wallet: createInitialSection('Wallet'),
    Progression: createInitialSection('Progression'),
  }
}
