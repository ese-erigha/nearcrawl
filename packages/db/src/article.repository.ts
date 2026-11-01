import {
  articleByIdSql,
  categoryArticlesSql,
  purgeArticlesSql,
  spatialNewsSql,
  upsertArticlesSql,
  type UpsertArticle,
} from './articles.sql.ts'
import { createDbClient, type DbClient } from './client.ts'

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

export type FiledTopic = {
  id: number
  name: string
}

export type ArticleRow = {
  id: string
  title: string
  summary: string
  body: string
  source_name: string
  source_url: string
  latitude: number
  longitude: number
  category_id: number
  filed: FiledTopic[]
  tags: string[]
  published_at: Date
  is_breaking: boolean
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
      false,
    )
    const truncated = records.length > query.limit
    const rows = truncated ? records.slice(0, query.limit) : records
    return { rows, truncated }
  }

  async findById(id: string): Promise<ArticleRow | null> {
    const records = await this.read(articleByIdSql(id), true)
    return records[0] ?? null
  }

  async listByCategory(categoryId: number, limit: number): Promise<ArticleRow[]> {
    return this.read(categoryArticlesSql(categoryId, limit), false)
  }

  async upsertByApitubeIds(articles: readonly UpsertArticle[]): Promise<void> {
    await this.db.execute(upsertArticlesSql(articles))
  }

  async purgeOlderThan(retentionDays: number): Promise<number> {
    const result = await this.db.execute(purgeArticlesSql(retentionDays))
    return result.rows.length
  }

  private async read(
    query: Parameters<DbClient['execute']>[0],
    includeBody: boolean,
  ): Promise<ArticleRow[]> {
    const result = await this.db.execute(query)
    return result.rows.map((record) => toRow(record as Record<string, unknown>, includeBody))
  }
}

function toRow(record: Record<string, unknown>, includeBody: boolean): ArticleRow {
  const tags = record.tags
  return {
    id: String(record.id),
    title: String(record.title),
    summary: String(record.summary),
    body: includeBody ? String(record.body ?? '') : '',
    source_name: String(record.source_name),
    source_url: String(record.source_url),
    latitude: Number(record.latitude),
    longitude: Number(record.longitude),
    category_id: Number(record.category_id),
    filed: readFiled(record.filed),
    tags: Array.isArray(tags) ? tags.map((tag) => String(tag)) : [],
    published_at:
      record.published_at instanceof Date ? record.published_at : new Date(String(record.published_at)),
    is_breaking: record.is_breaking === true,
  }
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
