import {
  articleByIdSql,
  breakingNewsSql,
  categoryArticlesSql,
  existingApitubeIdsSql,
  hotNewsSql,
  mentionNewsSql,
  purgeArticlesSql,
  spatialNewsSql,
  upsertArticlesSql,
  type UpsertArticle,
} from './articles.sql.ts'
import { createDbClient, type DbClient } from './client.ts'
import { countryPolygonWkt } from './country-border.ts'

export type BBox = {
  west: number
  south: number
  east: number
  north: number
}

export type SpatialNewsQuery = {
  bbox: BBox
  categoryId?: number
  limit: number
}

export type HotNewsQuery = {
  countryCode: string
  publishedAfter: Date
  limit: number
}

export type BreakingNewsQuery = {
  publishedAfter: Date
  limit: number
}

export type MentionNewsQuery = {
  text: string
  publishedAfter: Date
  limit: number
}

export type FiledTopic = {
  id: number
  name: string
}

export type ArticleRow = {
  id: string
  title: string
  description: string | null
  body: string
  body_html: string | null
  image_url: string | null
  favicon_url: string | null
  author_name: string | null
  source_name: string
  source_url: string
  source_home_url: string | null
  source_country_name: string | null
  source_country_code: string | null
  latitude: number
  longitude: number
  category_id: number
  filed: FiledTopic[]
  tags: string[]
  published_at: Date
  is_breaking: boolean
  is_free: boolean | null
  is_duplicate: boolean
  share_count: number
  read_time_minutes: number | null
  words_count: number | null
  source_rank: number | null
  story_id: string | null
  country_codes: string[]
}

export class DbArticleRepository {
  private readonly db: DbClient

  constructor(databaseUrl: string) {
    this.db = createDbClient(databaseUrl)
  }

  async findInBBox(query: SpatialNewsQuery): Promise<{ rows: ArticleRow[]; truncated: boolean }> {
    const records = await this.read(
      spatialNewsSql({
        west: query.bbox.west,
        south: query.bbox.south,
        east: query.bbox.east,
        north: query.bbox.north,
        categoryId: query.categoryId ?? null,
        limit: query.limit + 1,
      }),
    )
    const truncated = records.length > query.limit
    const rows = truncated ? records.slice(0, query.limit) : records
    return { rows, truncated }
  }

  async findById(id: string): Promise<ArticleRow | null> {
    const records = await this.read(articleByIdSql(id))
    return records[0] ?? null
  }

  async listByCategory(categoryId: number, limit: number): Promise<ArticleRow[]> {
    return this.read(categoryArticlesSql(categoryId, limit))
  }

  async listHotByCountry(query: HotNewsQuery): Promise<ArticleRow[]> {
    const countryPolygon = countryPolygonWkt(query.countryCode)
    if (!countryPolygon) return []
    return this.read(
      hotNewsSql({
        countryPolygon,
        publishedAfter: query.publishedAfter,
        limit: query.limit,
      }),
    )
  }

  async listBreaking(query: BreakingNewsQuery): Promise<ArticleRow[]> {
    return this.read(
      breakingNewsSql({
        publishedAfter: query.publishedAfter,
        limit: query.limit,
      }),
    )
  }

  async listMentions(query: MentionNewsQuery): Promise<ArticleRow[]> {
    return this.read(
      mentionNewsSql({
        text: query.text,
        publishedAfter: query.publishedAfter,
        limit: query.limit,
      }),
    )
  }

  async listExistingApitubeIds(apitubeIds: readonly string[]): Promise<string[]> {
    if (apitubeIds.length === 0) {
      return []
    }
    const result = await this.db.execute(existingApitubeIdsSql(apitubeIds))
    return result.rows.map((record) => String((record as { apitube_id: unknown }).apitube_id))
  }

  async upsertByApitubeIds(articles: readonly UpsertArticle[]): Promise<void> {
    await this.db.execute(upsertArticlesSql(articles))
  }

  async purgeOlderThan(retentionDays: number): Promise<number> {
    const result = await this.db.execute(purgeArticlesSql(retentionDays))
    return result.rows.length
  }

  private async read(query: Parameters<DbClient['execute']>[0]): Promise<ArticleRow[]> {
    const result = await this.db.execute(query)
    return result.rows.map((record) => toRow(record as Record<string, unknown>))
  }
}

function toRow(record: Record<string, unknown>): ArticleRow {
  const tags = record.tags
  return {
    id: String(record.id),
    title: String(record.title),
    description: nullableText(record.description),
    body: String(record.body ?? ''),
    body_html: nullableText(record.body_html),
    image_url: nullableText(record.image_url),
    favicon_url: nullableText(record.favicon_url),
    author_name: nullableText(record.author_name),
    source_name: String(record.source_name),
    source_url: String(record.source_url),
    source_home_url: nullableText(record.source_home_url),
    source_country_name: nullableText(record.source_country_name),
    source_country_code: nullableText(record.source_country_code),
    latitude: Number(record.latitude),
    longitude: Number(record.longitude),
    category_id: Number(record.category_id),
    filed: readFiled(record.filed),
    tags: Array.isArray(tags) ? tags.map((tag) => String(tag)) : [],
    published_at:
      record.published_at instanceof Date ? record.published_at : new Date(String(record.published_at)),
    is_breaking: record.is_breaking === true,
    is_free: record.is_free === true ? true : record.is_free === false ? false : null,
    is_duplicate: record.is_duplicate === true,
    share_count: nullableInt(record.share_count) ?? 0,
    read_time_minutes: nullableInt(record.read_time_minutes),
    words_count: nullableInt(record.words_count),
    source_rank: nullableInt(record.source_rank),
    story_id: nullableText(record.story_id),
    country_codes: readCodes(record.country_codes),
  }
}

function readCodes(value: unknown): string[] {
  const parsed = typeof value === 'string' ? parseJson(value) : value
  if (!Array.isArray(parsed)) {
    return []
  }
  return parsed.map((code) => String(code))
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return []
  }
}

function nullableText(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null
}

function nullableInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value
  }
  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    return Number(value)
  }
  return null
}

function readFiled(value: unknown): FiledTopic[] {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value
  if (!Array.isArray(parsed)) {
    return []
  }
  return parsed.flatMap((item) => {
    if (typeof item !== 'object' || item === null || !('id' in item) || !('name' in item)) {
      return []
    }
    const topic = item as { id: unknown; name: unknown }
    return [{ id: Number(topic.id), name: String(topic.name) }]
  })
}
