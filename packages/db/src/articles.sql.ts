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

const countryCodesSql = sql`
  COALESCE(
    (
      SELECT json_agg(article_countries.country_code ORDER BY article_countries.country_code)
      FROM article_countries
      WHERE article_countries.article_id = articles.id
    ),
    '[]'::json
  )
`

const articleColumnsSql = sql`
  articles.id, articles.title, articles.description, articles.body, articles.body_html,
  articles.image_url, articles.favicon_url, articles.author_name,
  articles.source_name, articles.source_url, articles.source_home_url,
  articles.source_country_name, articles.source_country_code,
  articles.latitude, articles.longitude, articles.category_id, ${filedCategoriesSql} AS filed,
  ${countryCodesSql} AS country_codes,
  articles.tags, articles.published_at, articles.is_breaking, articles.read_time_minutes,
  articles.is_free, articles.share_count, articles.words_count, articles.source_rank, articles.story_id
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
    SELECT ${articleColumnsSql}
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
    SELECT ${articleColumnsSql}
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
    SELECT ${articleColumnsSql}
    FROM articles
    WHERE articles.id = ${id}
  `
}

export type HotNewsStatement = {
  countryCode: string
  publishedAfter: Date
  limit: number
}

export function hotNewsSql(input: HotNewsStatement): SQL {
  return sql`
    SELECT ${articleColumnsSql}
    FROM articles
    JOIN article_countries ON article_countries.article_id = articles.id
    WHERE article_countries.country_code = ${input.countryCode}
      AND articles.published_at >= ${input.publishedAfter}::timestamptz
      AND articles.is_duplicate = false
    ORDER BY articles.is_breaking DESC, articles.share_count DESC, articles.published_at DESC
    LIMIT ${input.limit}
  `
}

export type BreakingNewsStatement = {
  publishedAfter: Date
  limit: number
}

export function breakingNewsSql(input: BreakingNewsStatement): SQL {
  return sql`
    SELECT ${articleColumnsSql}
    FROM articles
    WHERE articles.is_breaking = true
      AND articles.is_duplicate = false
      AND articles.published_at >= ${input.publishedAfter}::timestamptz
    ORDER BY articles.published_at DESC, articles.id DESC
    LIMIT ${input.limit}
  `
}

export type MentionNewsStatement = {
  text: string
  publishedAfter: Date
  limit: number
}

export function mentionNewsSql(input: MentionNewsStatement): SQL {
  // The english dictionary drops a stop word, so that word matches nothing.
  const match = sql`websearch_to_tsquery('english'::regconfig, ${input.text})`
  return sql`
    SELECT ${articleColumnsSql}
    FROM articles
    WHERE articles.is_duplicate = false
      AND articles.published_at >= ${input.publishedAfter}::timestamptz
      AND (
        articles.search_vector @@ ${match}
        OR to_tsvector('english'::regconfig, articles.body) @@ ${match}
      )
    ORDER BY articles.is_breaking DESC, articles.share_count DESC, articles.published_at DESC
    LIMIT ${input.limit}
  `
}

export type FiledCategoryWrite = {
  categoryId: number
  score: number | null
}

export type UpsertArticle = {
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
  latitude: number
  longitude: number
  categoryId: number
  categoryIds: number[]
  filedCategories: FiledCategoryWrite[]
  countryCodes: string[]
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

// One statement for the page. Postgres uses one snapshot, so the delete only removes join rows that are not in the new set.
export function upsertArticleSql(article: UpsertArticle): SQL {
  return upsertArticlesSql([article])
}

export function upsertArticlesSql(articles: readonly UpsertArticle[]): SQL {
  if (articles.length === 0) {
    throw new Error('upsert requires at least one article')
  }
  for (const article of articles) {
    if (article.filedCategories.length === 0) {
      throw new Error('upsert requires at least one category')
    }
  }
  return sql`
    WITH incoming AS (
      SELECT * FROM (VALUES ${articleRows(articles)}) AS v(
        apitube_id, title, description, body, body_html, image_url, favicon_url, author_name,
        source_name, source_url, source_home_url, source_country_name, source_country_code,
        latitude, longitude, category_id, tags, published_at, is_breaking, is_free, is_duplicate,
        share_count, read_time_minutes, words_count, source_rank, story_id
      )
    ),
    upserted AS (
      INSERT INTO articles (
        apitube_id, title, description, body, body_html, image_url, favicon_url, author_name,
        source_name, source_url, source_home_url, source_country_name, source_country_code,
        latitude, longitude, category_id, tags, published_at, is_breaking, is_free, is_duplicate,
        share_count, read_time_minutes, words_count, source_rank, story_id
      )
      SELECT
        apitube_id, title, description, body, body_html, image_url, favicon_url, author_name,
        source_name, source_url, source_home_url, source_country_name, source_country_code,
        latitude, longitude, category_id, tags, published_at, is_breaking, is_free, is_duplicate,
        share_count, read_time_minutes, words_count, source_rank, story_id
      FROM incoming
      ON CONFLICT (apitube_id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        body = EXCLUDED.body,
        body_html = EXCLUDED.body_html,
        image_url = EXCLUDED.image_url,
        favicon_url = EXCLUDED.favicon_url,
        author_name = EXCLUDED.author_name,
        source_name = EXCLUDED.source_name,
        source_url = EXCLUDED.source_url,
        source_home_url = EXCLUDED.source_home_url,
        source_country_name = EXCLUDED.source_country_name,
        source_country_code = EXCLUDED.source_country_code,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        category_id = EXCLUDED.category_id,
        tags = EXCLUDED.tags,
        published_at = EXCLUDED.published_at,
        is_breaking = EXCLUDED.is_breaking,
        is_free = EXCLUDED.is_free,
        is_duplicate = EXCLUDED.is_duplicate,
        share_count = EXCLUDED.share_count,
        read_time_minutes = EXCLUDED.read_time_minutes,
        words_count = EXCLUDED.words_count,
        source_rank = EXCLUDED.source_rank,
        story_id = EXCLUDED.story_id
      RETURNING id, apitube_id
    ),
    filed AS (
      SELECT * FROM (VALUES ${filedRows(articles)}) AS f(apitube_id, category_id, score)
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
    ),
    scored AS (
      INSERT INTO article_categories (article_id, category_id, score)
      SELECT u.id, f.category_id, f.score
      FROM upserted AS u
      JOIN filed AS f ON f.apitube_id = u.apitube_id
      ON CONFLICT (article_id, category_id) DO UPDATE SET score = EXCLUDED.score
      RETURNING article_id
    ),
    countries AS (
      ${countryRows(articles)}
    ),
    removed_countries AS (
      DELETE FROM article_countries AS ac
      USING upserted AS u
      WHERE ac.article_id = u.id
        AND NOT EXISTS (
          SELECT 1 FROM countries AS c
          WHERE c.apitube_id = u.apitube_id
            AND c.country_code = ac.country_code
        )
    )
    INSERT INTO article_countries (article_id, country_code)
    SELECT u.id, c.country_code
    FROM upserted AS u
    JOIN countries AS c ON c.apitube_id = u.apitube_id
    WHERE c.country_code IS NOT NULL
    ON CONFLICT (article_id, country_code) DO NOTHING
  `
}

export function existingApitubeIdsSql(apitubeIds: readonly string[]): SQL {
  const ids = sql.join(
    apitubeIds.map((apitubeId) => sql`${apitubeId}`),
    sql`, `,
  )
  return sql`SELECT apitube_id FROM articles WHERE apitube_id IN (${ids})`
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
        ${article.description},
        ${article.body},
        ${article.bodyHtml},
        ${article.imageUrl},
        ${article.faviconUrl},
        ${article.authorName},
        ${article.sourceName},
        ${article.sourceUrl},
        ${article.sourceHomeUrl},
        ${article.sourceCountryName},
        ${article.sourceCountryCode},
        ${article.latitude}::float8,
        ${article.longitude}::float8,
        ${article.categoryId}::int,
        ${textArray(article.tags)},
        ${article.publishedAt}::timestamptz,
        ${article.isBreaking}::boolean,
        ${article.isFree}::boolean,
        ${article.isDuplicate}::boolean,
        ${article.shareCount}::int,
        ${article.readTimeMinutes}::int,
        ${article.wordsCount}::int,
        ${article.sourceRank}::int,
        ${article.storyId}
      )`,
    ),
    sql`, `,
  )
}

function filedRows(articles: readonly UpsertArticle[]): SQL {
  const rows = articles.flatMap((article) =>
    article.filedCategories.map(
      (filed) => sql`(${article.apitubeId}, ${filed.categoryId}::int, ${filed.score}::float8)`,
    ),
  )
  return sql.join(rows, sql`, `)
}

function countryRows(articles: readonly UpsertArticle[]): SQL {
  const rows = articles.flatMap((article) =>
    article.countryCodes.map((countryCode) => sql`(${article.apitubeId}, ${countryCode})`),
  )
  if (rows.length === 0) {
    return sql`SELECT NULL::text AS apitube_id, NULL::text AS country_code WHERE false`
  }
  return sql`SELECT * FROM (VALUES ${sql.join(rows, sql`, `)}) AS c(apitube_id, country_code)`
}

export function compileSql(query: SQL): CompiledSql {
  const compiled = dialect.sqlToQuery(query)
  return { sql: compiled.sql, params: [...compiled.params] }
}
