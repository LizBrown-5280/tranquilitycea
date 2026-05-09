import type { Gw2EndpointRunResult, Gw2SectionData } from '@/types/gw2'

import {
  createMetricCard,
  createSectionRecords,
  deriveSectionState,
  extractIconUrl,
  flattenPayloadEntries,
  getSectionResults,
} from '@/services/gw2/aggregators/helpers'
import { parseCurrencyMetadata, parseWalletEntries } from '@/services/gw2/payloadParsers'

export function aggregateWallet(
  allResults: Gw2EndpointRunResult[],
  hasKey: boolean,
): Gw2SectionData {
  const sectionResults = getSectionResults('Wallet', allResults)
  const metadataResults = sectionResults.filter(
    (result) => result.endpointId === 'currency_metadata' || result.scope === 'public',
  )
  const walletResults = sectionResults.filter(
    (result) => result.endpointId === 'account_wallet' || result.scope === 'account',
  )

  const knownCurrencies = parseCurrencyMetadata(
    flattenPayloadEntries(metadataResults.flatMap((result) => result.payload)),
  ).sort((left, right) => left.id - right.id)
  const walletEntries = parseWalletEntries(
    flattenPayloadEntries(walletResults.flatMap((result) => result.payload)),
  ).sort((left, right) => left.id - right.id)
  const currencyIconUrl = extractIconUrl(knownCurrencies)
  const walletByCurrencyId = new Set(walletEntries.map((entry) => entry.id))
  const matchedCurrencyCount = knownCurrencies.filter((currency) =>
    walletByCurrencyId.has(currency.id),
  ).length
  const nonZeroBalanceCount = walletEntries.filter((entry) => entry.value > 0).length
  const currencyIdOrderPreview = knownCurrencies
    .map((currency) => currency.id)
    .slice(0, 8)
    .join(', ')
  const walletIdOrderPreview = walletEntries
    .map((entry) => entry.id)
    .slice(0, 8)
    .join(', ')
  const walletValueByCurrencyId = new Map(walletEntries.map((entry) => [entry.id, entry.value]))
  const currencyRows = knownCurrencies.slice(0, 16).map((currency) => {
    const label = currency.name ?? `Currency ${currency.id}`
    const value = walletValueByCurrencyId.has(currency.id)
      ? String(walletValueByCurrencyId.get(currency.id))
      : hasKey
        ? '0'
        : 'balance pending key'

    return `wallet display row: ${label} - ${value}`
  })

  const accountOnlyRows = knownCurrencies.length
    ? []
    : walletEntries
        .slice(0, 16)
        .map((entry) => `wallet display row: Currency ${entry.id} - ${entry.value}`)
  const currencyNamePreview = knownCurrencies
    .map((currency) => currency.name)
    .filter((name): name is string => typeof name === 'string' && name.length > 0)
    .slice(0, 5)

  const records = [
    `wallet entries tracked: ${walletEntries.length}`,
    `currency metadata mapped: ${knownCurrencies.length}`,
    `currencies with account values: ${matchedCurrencyCount}`,
    `non-zero currency balances: ${nonZeroBalanceCount}`,
    `currency id order preview: ${currencyIdOrderPreview.length > 0 ? currencyIdOrderPreview : 'n/a'}`,
    `wallet id order preview: ${walletIdOrderPreview.length > 0 ? walletIdOrderPreview : 'n/a'}`,
    `currency catalog preview: ${currencyNamePreview.length > 0 ? currencyNamePreview.join(', ') : 'n/a'}`,
    ...currencyRows,
    ...accountOnlyRows,
    ...createSectionRecords(sectionResults),
  ]

  return {
    name: 'Wallet',
    state: deriveSectionState('Wallet', sectionResults, hasKey),
    summary: `${knownCurrencies.length} public currency definitions with ${walletEntries.length} account balance entr${walletEntries.length === 1 ? 'y' : 'ies'} loaded`,
    metrics: [
      createMetricCard(
        'wallet-entry-count',
        'Wallet Entries',
        walletEntries.length,
        'Account wallet rows currently available for currency amount rendering.',
        undefined,
        {
          tone: walletEntries.length > 0 ? 'good' : 'attention',
          badge: walletEntries.length > 0 ? 'Ready' : 'Needs Data',
        },
      ),
      createMetricCard(
        'wallet-currency-metadata-count',
        'Currency Metadata',
        knownCurrencies.length,
        'Public currency metadata rows available to map wallet ids to readable currency names.',
        currencyIconUrl,
        {
          tone: knownCurrencies.length > 0 ? 'good' : 'attention',
          badge: knownCurrencies.length > 0 ? 'Mapped' : 'Needs Data',
        },
      ),
    ],
    records,
  }
}
