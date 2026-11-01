import { sql, type SQL } from 'drizzle-orm'
import { PgDialect } from 'drizzle-orm/pg-core'

const dialect = new PgDialect()

const filedCategoriesSql = sql`
  COALESCE(
    (
      SELECT json_agg(json_build_object('id', c.id, 'name', c.name))
      FROM article_categories ac
      JOIN categories c ON c.id = ac.category_id
      WHERE ac.article_id = articles.id
    ),
    '[]'::json
  )
`

export type SpatialNewsStatement = {
  west: number
  south: number
  east: number
  north: number
  categoryId: number | null
  limit: number
}

export type CompiledSql = {
  sql: string
  params: unknown[]
}

export function spatialNewsSql(input: SpatialNewsStatement): SQL {
  return sql`
    SELECT id, title, summary, source_name, source_url,
           latitude, longitude, category_id, ${filedCategoriesSql} AS filed,
           tags, published_at, is_breaking
    FROM articles
    WHERE latitude BETWEEN ${input.south} AND ${input.north}
      AND (
        (${input.west} <= ${input.east} AND longitude BETWEEN ${input.west} AND ${input.east})
        OR (${input.west} > ${input.east} AND (longitude >= ${input.west} OR longitude <= ${input.east}))
      )
      AND (
        ${input.categoryId}::int IS NULL
        OR EXISTS (
          SELECT 1 FROM article_categories
          WHERE article_categories.article_id = articles.id
            AND article_categories.category_id = ${input.categoryId}
        )
      )
    ORDER BY published_at DESC, id DESC
    LIMIT ${input.limit}
  `
}

export function categoryArticlesSql(categoryId: number, limit: number): SQL {
  return sql`
    SELECT id, title, summary, source_name, source_url,
           latitude, longitude, category_id, ${filedCategoriesSql} AS filed,
           tags, published_at, is_breaking
    FROM articles
    WHERE EXISTS (
      SELECT 1 FROM article_categories
      WHERE article_categories.article_id = articles.id
        AND article_categories.category_id = ${categoryId}
    )
    ORDER BY published_at DESC, id DESC
    LIMIT ${limit}
  `
}

export function articleByIdSql(id: string): SQL {
  return sql`
    SELECT id, title, summary, body, source_name, source_url,
           latitude, longitude, category_id, ${filedCategoriesSql} AS filed,
           tags, published_at, is_breaking
    FROM articles
    WHERE id = ${id}
  `
}

export type UpsertArticle = {
  apitubeId: string
  title: string
  summary: string
  body: string
  sourceName: string
  sourceUrl: string
  latitude: number
  longitude: number
  categoryId: number
  categoryIds: number[]
  tags: string[]
  publishedAt: Date
  isBreaking: boolean
  storyId: string | null
}

// One statement for the page. Postgres uses one snapshot, so the delete only removes join rows that are not in the new set.
export function upsertArticleSql(article: UpsertArticle): SQL {
  return upsertArticlesSql([article])
}

export function upsertArticlesSql(articles: readonly UpsertArticle[]): SQL {
  if (articles.length === 0) {
    throw new Error('upsert requires at least one article')
  }
  for (const article of articles) {
    if (article.categoryIds.length === 0) {
      throw new Error('upsert requires at least one category')
    }
  }
  return sql`
    WITH incoming AS (
      SELECT * FROM (VALUES ${articleRows(articles)}) AS v(
        apitube_id, title, summary, body, source_name, source_url,
        latitude, longitude, category_id, tags, published_at, is_breaking, story_id
      )
    ),
    upserted AS (
      INSERT INTO articles (
        apitube_id, title, summary, body, source_name, source_url,
        latitude, longitude, category_id, tags, published_at, is_breaking, story_id
      )
      SELECT
        apitube_id, title, summary, body, source_name, source_url,
        latitude, longitude, category_id, tags, published_at, is_breaking, story_id
      FROM incoming
      ON CONFLICT (apitube_id) DO UPDATE SET
        title = EXCLUDED.title,
        summary = EXCLUDED.summary,
        body = EXCLUDED.body,
        source_name = EXCLUDED.source_name,
        source_url = EXCLUDED.source_url,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        category_id = EXCLUDED.category_id,
        tags = EXCLUDED.tags,
        published_at = EXCLUDED.published_at,
        is_breaking = EXCLUDED.is_breaking,
        story_id = EXCLUDED.story_id
      RETURNING id, apitube_id
    ),
    filed AS (
      SELECT * FROM (VALUES ${filedRows(articles)}) AS f(apitube_id, category_id)
    ),
    removed AS (
      DELETE FROM article_categories AS ac
      USING upserted AS u
      WHERE ac.article_id = u.id
        AND NOT EXISTS (
          SELECT 1 FROM filed AS f
          WHERE f.apitube_id = u.apitube_id
            AND f.category_id = ac.category_id
        )
    )
    INSERT INTO article_categories (article_id, category_id)
    SELECT u.id, f.category_id
    FROM upserted AS u
    JOIN filed AS f ON f.apitube_id = u.apitube_id
    ON CONFLICT (article_id, category_id) DO NOTHING
  `
}

export function purgeArticlesSql(retentionDays: number): SQL {
  return sql`
    DELETE FROM articles
    WHERE published_at < now() - make_interval(days => ${retentionDays}::int)
    RETURNING id
  `
}

function textArray(values: readonly string[]): SQL {
  if (values.length === 0) {
    return sql`'{}'::text[]`
  }
  return sql`ARRAY[${sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  )}]::text[]`
}

function articleRows(articles: readonly UpsertArticle[]): SQL {
  return sql.join(
    articles.map(
      (article) => sql`(
        ${article.apitubeId},
        ${article.title},
        ${article.summary},
        ${article.body},
        ${article.sourceName},
        ${article.sourceUrl},
        ${article.latitude},
        ${article.longitude},
        ${article.categoryId},
        ${textArray(article.tags)},
        ${article.publishedAt},
        ${article.isBreaking},
        ${article.storyId}
      )`,
    ),
    sql`, `,
  )
}

function filedRows(articles: readonly UpsertArticle[]): SQL {
  const rows = articles.flatMap((article) =>
    article.categoryIds.map((categoryId) => sql`(${article.apitubeId}, ${categoryId}::int)`),
  )
  return sql.join(rows, sql`, `)
}

export function compileSql(query: SQL): CompiledSql {
  const compiled = dialect.sqlToQuery(query)
  return { sql: compiled.sql, params: [...compiled.params] }
}
