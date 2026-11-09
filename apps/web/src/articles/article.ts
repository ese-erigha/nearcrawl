export type FiledTopic = {
  id: number
  name: string
}

export type Article = {
  id: string
  title: string
  description: string | null
  body: string
  bodyHtml: string | null
  imageUrl: string | null
  faviconUrl: string | null
  authorName: string | null
  sourceName: string
  sourceUrl: string
  sourceHomeUrl: string | null
  sourceCountryName: string | null
  sourceCountryCode: string | null
  latitude: number
  longitude: number
  categoryId: number
  categories: FiledTopic[]
  countryCodes: string[]
  tags: string[]
  publishedAt: string
  isBreaking: boolean
  readTimeMinutes: number | null
  wordsCount: number | null
  isFree: boolean | null
  shareCount: number
  sourceRank: number | null
  storyId: string | null
}

const MINUTE_MS = 60_000

export function regionName(code: string): string {
  const name = new Intl.DisplayNames(['en'], { type: 'region' }).of(code)
  return name ?? code
}

export function articleCountry(item: { countryCodes: string[] }): string {
  const code = item.countryCodes[0]
  if (!code) return ''
  return regionName(code)
}

export function articleAge(item: { publishedAt: string }, now = Date.now()): string {
  const elapsed = Math.max(0, now - Date.parse(item.publishedAt))
  const minutes = Math.floor(elapsed / MINUTE_MS)
  if (minutes < 60) return `${Math.max(1, minutes)}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function articleTopic(item: { categoryId: number; categories: FiledTopic[] }): string {
  const filed = item.categories.find((topic) => topic.id === item.categoryId)
  return filed?.name ?? 'News'
}
