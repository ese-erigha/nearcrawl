export const VISITOR_COUNTRY = 'Japan'
export const VISITOR_COUNTRY_CODE = 'JP'

export const CATEGORY = {
  ALL: 'all',
  POLITICS: 'politics',
  FINANCE: 'finance',
  DISASTER: 'disaster',
} as const

export type Category = (typeof CATEGORY)[keyof typeof CATEGORY]

export const CATEGORY_LABEL: Record<Category, string> = {
  [CATEGORY.ALL]: 'All',
  [CATEGORY.POLITICS]: 'Politics',
  [CATEGORY.FINANCE]: 'Finance',
  [CATEGORY.DISASTER]: 'Disaster',
}

// Menu ids match packages/db CATEGORY.
export const TOPIC = {
  POLITICS: 1,
  DISASTER: 4,
  FINANCE: 6,
} as const

const TOPIC_ID: Record<Exclude<Category, typeof CATEGORY.ALL>, number> = {
  [CATEGORY.POLITICS]: TOPIC.POLITICS,
  [CATEGORY.FINANCE]: TOPIC.FINANCE,
  [CATEGORY.DISASTER]: TOPIC.DISASTER,
}

const COUNTRY_NAME: Record<string, string> = {
  JP: 'Japan',
  US: 'United States',
  GB: 'United Kingdom',
  NG: 'Nigeria',
  DE: 'Germany',
}

export const BRIEF_GROUP = {
  BREAKING: 'breaking',
  ALSO_HOT: 'also-hot',
} as const

export type BriefGroupId = (typeof BRIEF_GROUP)[keyof typeof BRIEF_GROUP]

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

const HOUR_MS = 3_600_000
const MINUTE_MS = 60_000
const NOW = Date.now()

type ArticleInput = {
  id: string
  title: string
  description: string
  body: string
  sourceName: string
  sourceUrl: string
  latitude: number
  longitude: number
  topic: Exclude<Category, typeof CATEGORY.ALL>
  countryCode: string
  hoursAgo: number
  isBreaking: boolean
  shareCount: number
  authorName?: string
  readTimeMinutes?: number
  wordsCount?: number
}

function article(input: ArticleInput): Article {
  const categoryId = TOPIC_ID[input.topic]
  return {
    id: input.id,
    title: input.title,
    description: input.description,
    body: input.body,
    bodyHtml: null,
    imageUrl: null,
    faviconUrl: null,
    authorName: input.authorName ?? null,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
    sourceHomeUrl: null,
    sourceCountryName: COUNTRY_NAME[input.countryCode] ?? null,
    sourceCountryCode: input.countryCode,
    latitude: input.latitude,
    longitude: input.longitude,
    categoryId,
    categories: [{ id: categoryId, name: CATEGORY_LABEL[input.topic] }],
    countryCodes: [input.countryCode],
    tags: [],
    publishedAt: new Date(NOW - input.hoursAgo * HOUR_MS).toISOString(),
    isBreaking: input.isBreaking,
    readTimeMinutes: input.readTimeMinutes ?? null,
    wordsCount: input.wordsCount ?? null,
    isFree: true,
    shareCount: input.shareCount,
    sourceRank: null,
    storyId: null,
  }
}

export const ARTICLES: Article[] = [
  article({
    id: 'kyushu-typhoon',
    title: 'Typhoon watch covers Kyushu ports',
    description: 'Ferries stop and coastal roads close as the storm turns toward the southwest.',
    body: 'Ferries stop and coastal roads close as the storm turns toward the southwest. Harbor masters keep the night watch in place.',
    sourceName: 'Kyodo',
    sourceUrl: 'https://english.kyodonews.net/kyushu-typhoon',
    latitude: 32.8,
    longitude: 130.7,
    topic: CATEGORY.DISASTER,
    countryCode: 'JP',
    hoursAgo: 2,
    isBreaking: true,
    shareCount: 40,
    authorName: 'Aya Sato',
    readTimeMinutes: 3,
    wordsCount: 420,
  }),
  article({
    id: 'boj-hint',
    title: 'Nikkei slips after a rate hint',
    description: 'Traders cut bank shares after an official signaled a closer look at the next move.',
    body: 'Traders cut bank shares after an official signaled a closer look at the next move. The afternoon session closed lower.',
    sourceName: 'Nikkei',
    sourceUrl: 'https://asia.nikkei.com/boj-hint',
    latitude: 35.68,
    longitude: 139.76,
    topic: CATEGORY.FINANCE,
    countryCode: 'JP',
    hoursAgo: 5,
    isBreaking: true,
    shareCount: 28,
    readTimeMinutes: 4,
    wordsCount: 510,
  }),
  article({
    id: 'diet-defense',
    title: 'Diet opens the defense budget debate',
    description: 'Lawmakers argue over shipyard spending before the autumn session ends.',
    body: 'Lawmakers argue over shipyard spending before the autumn session ends. A vote is set for later in the week.',
    sourceName: 'Asahi',
    sourceUrl: 'https://www.asahi.com/diet-defense',
    latitude: 35.67,
    longitude: 139.75,
    topic: CATEGORY.POLITICS,
    countryCode: 'JP',
    hoursAgo: 6,
    isBreaking: false,
    shareCount: 12,
    readTimeMinutes: 5,
    wordsCount: 640,
  }),
  article({
    id: 'hokkaido-quake',
    title: 'Small quake felt across southern Hokkaido',
    description: 'No tsunami warning follows the shake. Rail checks continue through the evening.',
    body: 'No tsunami warning follows the shake. Rail checks continue through the evening. Stations report no damage.',
    sourceName: 'NHK',
    sourceUrl: 'https://www3.nhk.or.jp/hokkaido-quake',
    latitude: 42.3,
    longitude: 140.9,
    topic: CATEGORY.DISASTER,
    countryCode: 'JP',
    hoursAgo: 9,
    isBreaking: false,
    shareCount: 9,
    readTimeMinutes: 2,
    wordsCount: 260,
  }),
  article({
    id: 'osaka-expo',
    title: 'Osaka crowd record falls on a clear Saturday',
    description: 'The waterfront stays open late after the day count passes the spring mark.',
    body: 'The waterfront stays open late after the day count passes the spring mark. Trains add cars through the evening.',
    sourceName: 'Mainichi',
    sourceUrl: 'https://mainichi.jp/osaka-expo',
    latitude: 34.65,
    longitude: 135.39,
    topic: CATEGORY.POLITICS,
    countryCode: 'JP',
    hoursAgo: 24,
    isBreaking: false,
    shareCount: 6,
    readTimeMinutes: 3,
    wordsCount: 300,
  }),
  article({
    id: 'us-ports',
    title: 'East Coast ports slow as the strike spreads',
    description: 'Containers sit at the gate from Savannah to New York.',
    body: 'Containers sit at the gate from Savannah to New York. Night gates stay shut.',
    sourceName: 'Reuters',
    sourceUrl: 'https://www.reuters.com/us-ports',
    latitude: 40.7,
    longitude: -74.0,
    topic: CATEGORY.FINANCE,
    countryCode: 'US',
    hoursAgo: 1,
    isBreaking: true,
    shareCount: 80,
    readTimeMinutes: 4,
    wordsCount: 480,
  }),
  article({
    id: 'uk-floods',
    title: 'Floodwater closes the northern rail spine',
    description: 'Evening services stop between Manchester and Leeds.',
    body: 'Evening services stop between Manchester and Leeds. Replacement buses run on the main road.',
    sourceName: 'BBC',
    sourceUrl: 'https://www.bbc.com/uk-floods',
    latitude: 53.5,
    longitude: -2.2,
    topic: CATEGORY.DISASTER,
    countryCode: 'GB',
    hoursAgo: 3,
    isBreaking: true,
    shareCount: 33,
    readTimeMinutes: 3,
    wordsCount: 350,
  }),
  article({
    id: 'lagos-depot',
    title: 'Lagos fuel queues grow after a depot fire',
    description: 'Stations limit sales while crews keep the road around the depot shut.',
    body: 'Stations limit sales while crews keep the road around the depot shut. The night queue reaches the main junction.',
    sourceName: 'Premium Times',
    sourceUrl: 'https://www.premiumtimesng.com/lagos-depot',
    latitude: 6.45,
    longitude: 3.4,
    topic: CATEGORY.DISASTER,
    countryCode: 'NG',
    hoursAgo: 4,
    isBreaking: true,
    shareCount: 21,
    readTimeMinutes: 3,
    wordsCount: 340,
  }),
  article({
    id: 'ruhr-factory',
    title: 'Factory fire stops a Ruhr steel line',
    description: 'Night shift workers leave the site. The furnace stays offline.',
    body: 'Night shift workers leave the site. The furnace stays offline while crews inspect the hall.',
    sourceName: 'DW',
    sourceUrl: 'https://www.dw.com/ruhr-factory',
    latitude: 51.5,
    longitude: 7.1,
    topic: CATEGORY.FINANCE,
    countryCode: 'DE',
    hoursAgo: 8,
    isBreaking: true,
    shareCount: 15,
    readTimeMinutes: 3,
    wordsCount: 310,
  }),
]

export function articleCountry(item: Article): string {
  const code = item.countryCodes[0]
  if (!code) return ''
  return COUNTRY_NAME[code] ?? code
}

export function articleAge(item: Article, now = Date.now()): string {
  const elapsed = Math.max(0, now - Date.parse(item.publishedAt))
  const minutes = Math.floor(elapsed / MINUTE_MS)
  if (minutes < 60) return `${Math.max(1, minutes)}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function articleTopic(item: Article): string {
  const filed = item.categories.find((topic) => topic.id === item.categoryId)
  return filed?.name ?? 'News'
}

export function listCountryStories(category: Category, query: string): Article[] {
  const needle = query.trim().toLowerCase()
  const topicId = category === CATEGORY.ALL ? null : TOPIC_ID[category]
  return ARTICLES.filter((item) => item.countryCodes.includes(VISITOR_COUNTRY_CODE))
    .filter((item) => topicId === null || item.categoryId === topicId)
    .filter((item) => needle.length === 0 || item.title.toLowerCase().includes(needle))
}

export function listGlobalBreaking(): Article[] {
  return ARTICLES.filter((item) => item.isBreaking)
}

export function listBriefGroups(): { id: BriefGroupId; label: string; stories: Article[] }[] {
  const countryStories = listCountryStories(CATEGORY.ALL, '')
  return [
    {
      id: BRIEF_GROUP.BREAKING,
      label: 'Breaking',
      stories: countryStories.filter((item) => item.isBreaking),
    },
    {
      id: BRIEF_GROUP.ALSO_HOT,
      label: 'Also hot',
      stories: countryStories.filter((item) => !item.isBreaking),
    },
  ]
}
