import { DAY_MS, getIngestionConfig } from '../../config.ts'
import { httpClient, HttpError } from '../../http.client.ts'
import {
  articleSchema,
  categorySchema,
  countryCode,
  nullableText,
  placeCountry,
  placePoint,
  unknownItems,
} from './news.schema.ts'

const APITUBE_ORIGIN = 'https://api.apitube.io'
const ARTICLE_LANGUAGE = 'en'
const OPENING_LENGTH = 500

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

type ApitubeNewsResponse = {
  results: Record<string, unknown>[]
  has_next_pages: boolean
}

export async function listNewsPage(page: number): Promise<NewsPage> {
  const config = getIngestionConfig()
  const url = newsUrl(page, config.retentionDays)
  const body = await readNewsBody(url, config.apitubeApiKey)
  return toNewsPage(body)
}

async function readNewsBody(url: URL, apiKey: string): Promise<ApitubeNewsResponse> {
  try {
    const headers = {
      Accept: 'application/json',
      'X-API-Key': apiKey,
    }
    const body = await httpClient<ApitubeNewsResponse>(url, headers)
    return body;
  } catch (error) {
    if (error instanceof HttpError) {
      const message = error.detail
        ? `APITube responded ${error.status}: ${error.detail}`
        : `APITube responded ${error.status}`
      throw new Error(message)
    }
    throw error
  }
}

function toNewsPage(body: ApitubeNewsResponse): NewsPage {
  const items: NewsItem[] = []
  let dropped = 0
  for (const result of body.results) {
    const item = toNewsItem(result)
    if (item) {
      items.push(item)
    } else {
      dropped += 1
    }
  }
  return { items, dropped, hasNextPage: body.has_next_pages === true }
}

export function toNewsItem(value: unknown): NewsItem | null {
  const parsed = articleSchema.safeParse(value)
  if (!parsed.success) {
    return null
  }
  const article = parsed.data
  const name = article.source?.domain ?? hostname(article.href)
  if (!name) {
    return null
  }
  const point = coordinates(value, openingText(article))
  if (!point) {
    return null
  }
  const topics = newsTopics(value)
  return {
    apitubeId: article.id,
    title: article.title,
    description: article.description,
    body: article.body ?? article.description ?? article.title,
    bodyHtml: article.body_html,
    imageUrl: article.image,
    faviconUrl: article.source?.favicon ?? null,
    authorName: article.author?.name ?? null,
    sourceName: name,
    sourceUrl: article.href,
    sourceHomeUrl: article.source?.home_page_url ?? null,
    sourceCountryName: article.source?.location?.country_name ?? null,
    sourceCountryCode: article.source?.location?.country_code ?? null,
    latitude: point.latitude,
    longitude: point.longitude,
    countryCodes: storyCountryCodes(value),
    topics,
    medtopIds: topics.map((topic) => topic.medtopId),
    tags: keywordTags(value),
    publishedAt: article.published_at,
    isBreaking: article.is_breaking,
    isFree: article.is_free,
    isDuplicate: article.is_duplicate,
    shareCount: article.shares?.total ?? 0,
    readTimeMinutes: article.read_time,
    wordsCount: article.words_count,
    sourceRank: article.source?.rankings?.opr ?? null,
    storyId: article.story?.id ?? null,
  }
}

function newsUrl(page: number, retentionDays: number): URL {
  const url = new URL('/v1/news/everything', APITUBE_ORIGIN)
  url.search = newsQuery(page, retentionDays).toString()
  return url
}

function newsQuery(page: number, retentionDays: number): URLSearchParams {
  const publishedAfter = new Date(Date.now() - retentionDays * DAY_MS)
  const query = new URLSearchParams()
  query.set('page', String(page))
  query.set('sort.by', 'published_at')
  query.set('sort.order', 'desc')
  query.set('published_at.start', publishedAfter.toISOString())
  query.set('language.code', ARTICLE_LANGUAGE)
  return query
}

function hostname(href: string): string | null {
  if (!URL.canParse(href)) {
    return null
  }
  return new URL(href).hostname
}

function openingText(article: { title: string; description: string | null; body: string | null }): string {
  // A place named only in the site menu is not the story.
  const description = article.description?.slice(0, OPENING_LENGTH) ?? ''
  const body = article.body?.slice(0, OPENING_LENGTH) ?? ''
  return `${article.title}\n${description}\n${body}`.toLowerCase()
}

function coordinates(value: unknown, opening: string): { latitude: number; longitude: number } | null {
  for (const place of unknownItems.parse(recordField(value, 'locations_mentioned'))) {
    const parsed = placePoint.safeParse(place)
    if (!parsed.success) {
      continue
    }
    const name = nullableText.parse(isRecord(place) ? place.name : undefined)
    if (!name || !opening.includes(name.toLowerCase())) {
      continue
    }
    return { latitude: parsed.data.lat, longitude: parsed.data.lng }
  }
  return null
}

function newsTopics(value: unknown): NewsTopic[] {
  return unknownItems.parse(recordField(value, 'categories')).flatMap((category) => {
    const parsed = categorySchema.safeParse(category)
    if (!parsed.success) {
      return []
    }
    const medtopId = medtopText(parsed.data.links?.self)
    if (!medtopId) {
      return []
    }
    // The documented category object has no parent. A payload that sends parent as a medtop id is used.
    return [
      {
        medtopId,
        name: parsed.data.name,
        parentMedtopId: medtopText(parsed.data.parent),
        score: parsed.data.score,
      },
    ]
  })
}

function medtopText(value: unknown): string | null {
  const raw = nullableText.parse(value)
  if (!raw) {
    return null
  }
  return raw.match(/medtop:\d+/)?.[0] ?? null
}

function storyCountryCodes(value: unknown): string[] {
  const codes = new Set<string>()
  for (const place of unknownItems.parse(recordField(value, 'locations_mentioned'))) {
    const country = placeCountry.parse(place)
    const code = country ? countryCode.parse(country.country) : null
    if (code) {
      codes.add(code)
    }
  }
  return [...codes]
}

function keywordTags(value: unknown): string[] {
  return unknownItems.parse(recordField(value, 'keywords')).flatMap((keyword) => {
    const tag = nullableText.parse(keyword)
    return tag ? [tag] : []
  })
}

function recordField(value: unknown, name: string): unknown {
  if (!isRecord(value)) {
    return undefined
  }
  return value[name]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
