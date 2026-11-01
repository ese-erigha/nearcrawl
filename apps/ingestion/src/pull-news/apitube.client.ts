import { DAY_MS, getIngestionConfig } from '../config.ts'

const APITUBE_URL = 'https://api.apitube.io/v1/news/everything'
const ARTICLE_LANGUAGE = 'en'
const IPTC_MEDIATOPICS = 'iptc_mediatopics'

export type NewsTopic = {
  medtopId: string
  name: string | null
  parentMedtopId: string | null
  score: number | null
}

export type NewsItem = {
  apitubeId: string
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
  latitude: number | null
  longitude: number | null
  countryCodes: string[]
  topics: NewsTopic[]
  medtopIds: string[]
  tags: string[]
  publishedAt: Date
  isBreaking: boolean
  isFree: boolean | null
  isDuplicate: boolean
  shareCount: number
  readTimeMinutes: number | null
  wordsCount: number | null
  sourceRank: number | null
  storyId: string | null
}

export type NewsPage = {
  items: NewsItem[]
  dropped: number
  hasNextPage: boolean
}

export async function listNewsPage(page: number): Promise<NewsPage> {
  const config = getIngestionConfig()
  if (!config.apitubeApiKey) {
    throw new Error('APITUBE_API_KEY is required')
  }
  const url = newsUrl(page, config.retentionDays)
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-API-Key': config.apitubeApiKey,
    },
  })
  if (!response.ok) {
    throw new Error(`APITube responded ${response.status}`)
  }
  const payload: unknown = await response.json()
  return readNewsPage(payload)
}

export function readNewsPage(payload: unknown): NewsPage {
  if (!isRecord(payload) || payload.status === 'error' || !Array.isArray(payload.results)) {
    throw new Error('APITube response has no results')
  }
  const items: NewsItem[] = []
  let dropped = 0
  for (const result of payload.results) {
    const item = toNewsItem(result)
    if (item) {
      items.push(item)
    } else {
      dropped += 1
    }
  }
  return { items, dropped, hasNextPage: payload.has_next_pages === true }
}

export function toNewsItem(value: unknown): NewsItem | null {
  if (!isRecord(value)) {
    return null
  }
  const title = text(value.title)
  const sourceUrl = text(value.href)
  const published = publishedAt(value.published_at)
  const apitubeId = idText(value.id)
  if (!title || !sourceUrl || !published || !apitubeId) {
    return null
  }
  const name = sourceName(value, sourceUrl)
  if (!name) {
    return null
  }
  const description = text(value.description)
  const point = coordinates(value)
  const topics = newsTopics(value)
  const source = isRecord(value.source) ? value.source : undefined
  const sourceLocation = isRecord(source?.location) ? source.location : undefined
  const rankings = isRecord(source?.rankings) ? source.rankings : undefined
  const shares = isRecord(value.shares) ? value.shares : undefined
  return {
    apitubeId,
    title,
    description,
    body: text(value.body) ?? description ?? title,
    bodyHtml: text(value.body_html),
    imageUrl: text(value.image),
    faviconUrl: text(source?.favicon),
    authorName: authorName(value),
    sourceName: name,
    sourceUrl,
    sourceHomeUrl: text(source?.home_page_url),
    sourceCountryName: text(sourceLocation?.country_name),
    sourceCountryCode: countryCode(sourceLocation?.country_code),
    latitude: point?.latitude ?? null,
    longitude: point?.longitude ?? null,
    countryCodes: storyCountryCodes(value),
    topics,
    medtopIds: topics.map((topic) => topic.medtopId),
    tags: keywordTags(value),
    publishedAt: published,
    isBreaking: value.is_breaking === true,
    isFree: flag(value.is_free),
    isDuplicate: value.is_duplicate === true,
    shareCount: integer(shares?.total) ?? 0,
    readTimeMinutes: integer(value.read_time),
    wordsCount: integer(value.words_count),
    sourceRank: integer(rankings?.opr),
    storyId: storyId(value.story),
  }
}

function newsUrl(page: number, retentionDays: number): URL {
  const url = new URL(APITUBE_URL)
  const publishedAfter = new Date(Date.now() - retentionDays * DAY_MS)
  url.searchParams.set('page', String(page))
  url.searchParams.set('sort.by', 'published_at')
  url.searchParams.set('sort.order', 'desc')
  url.searchParams.set('published_at.start', publishedAfter.toISOString())
  url.searchParams.set('language.code', ARTICLE_LANGUAGE)
  return url
}

function sourceName(article: Record<string, unknown>, href: string): string | null {
  const source = isRecord(article.source) ? article.source : undefined
  const domain = text(source?.domain)
  if (domain) {
    return domain
  }
  if (!URL.canParse(href)) {
    return null
  }
  return new URL(href).hostname
}

function coordinates(article: Record<string, unknown>): { latitude: number; longitude: number } | null {
  if (!Array.isArray(article.locations_mentioned)) {
    return null
  }
  for (const place of article.locations_mentioned) {
    if (!isRecord(place) || typeof place.lat !== 'number' || typeof place.lng !== 'number') {
      continue
    }
    return { latitude: place.lat, longitude: place.lng }
  }
  return null
}

function newsTopics(article: Record<string, unknown>): NewsTopic[] {
  if (!Array.isArray(article.categories)) {
    return []
  }
  return article.categories.flatMap((category) => {
    if (!isRecord(category) || category.taxonomy !== IPTC_MEDIATOPICS) {
      return []
    }
    const links = isRecord(category.links) ? category.links : undefined
    const medtopId = medtopText(links?.self)
    if (!medtopId) {
      return []
    }
    // The documented category object has no parent. A payload that sends parent as a medtop id is used.
    return [{ medtopId, name: text(category.name), parentMedtopId: medtopText(category.parent), score: finite(category.score) }]
  })
}

function medtopText(value: unknown): string | null {
  const raw = text(value)
  if (!raw) {
    return null
  }
  const match = raw.match(/medtop:\d+/)
  return match?.[0] ?? null
}

function storyCountryCodes(article: Record<string, unknown>): string[] {
  if (!Array.isArray(article.locations_mentioned)) {
    return []
  }
  const codes = new Set<string>()
  for (const place of article.locations_mentioned) {
    if (!isRecord(place)) {
      continue
    }
    const code = countryCode(place.country)
    if (code) {
      codes.add(code)
    }
  }
  return [...codes]
}

function countryCode(value: unknown): string | null {
  const raw = text(value)
  if (!raw || !/^[A-Za-z]{2}$/.test(raw)) {
    return null
  }
  return raw.toUpperCase()
}

function authorName(article: Record<string, unknown>): string | null {
  const author = isRecord(article.author) ? article.author : undefined
  return text(author?.name)
}

function integer(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return null
  }
  return value
}

function finite(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }
  return value
}

function flag(value: unknown): boolean | null {
  if (value === true || value === false) {
    return value
  }
  return null
}

function keywordTags(article: Record<string, unknown>): string[] {
  if (!Array.isArray(article.keywords)) {
    return []
  }
  return article.keywords.flatMap((keyword) => {
    const value = text(keyword)
    return value ? [value] : []
  })
}

function storyId(value: unknown): string | null {
  if (!isRecord(value)) {
    return null
  }
  return idText(value.id)
}

function publishedAt(value: unknown): Date | null {
  if (typeof value !== 'string') {
    return null
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date
}

function idText(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return text(value)
}

function text(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
