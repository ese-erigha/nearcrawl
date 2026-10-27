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

export function compileSql(query: SQL): CompiledSql {
  const compiled = dialect.sqlToQuery(query)
  return { sql: compiled.sql, params: [...compiled.params] }
}
