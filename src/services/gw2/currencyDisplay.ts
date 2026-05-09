export const GW2_COIN_CURRENCY_ID = 1

export const gw2CoinIcons = {
  copper: 'https://render.guildwars2.com/file/6CF8F96A3299CFC75D5CC90617C3C70331A1EF0E/156902.png',
  silver: 'https://render.guildwars2.com/file/E5A2197D78ECE4AE0349C8B3710D033D22DB0DA6/156907.png',
  gold: 'https://render.guildwars2.com/file/090A980A96D39FD36FBB004903644C6DBEFB1FFB/156904.png',
} as const

export interface Gw2CoinParts {
  gold: number
  silver: number
  copper: number
}

export function splitGw2Coin(balanceInCopper: number): Gw2CoinParts {
  const gold = Math.floor(balanceInCopper / 10000)
  const silver = Math.floor((balanceInCopper % 10000) / 100)
  const copper = balanceInCopper % 100

  return { gold, silver, copper }
}

export function formatGw2CoinPart(value: number): string {
  return String(value).padStart(2, '0')
}
