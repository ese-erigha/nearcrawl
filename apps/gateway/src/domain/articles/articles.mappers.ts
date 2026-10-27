import { sortFiledCategories } from 'db'

import type { ArticleRow, FiledTopic } from './articles.types.ts'

export type ArticlePin = {
  id: string
  title: string
  summary: string
  sourceName: string
  sourceUrl: string
  latitude: number
  longitude: number
  categoryId: number
  categories: FiledTopic[]
  tags: string[]
  publishedAt: string
  isBreaking: boolean
}

export type ArticleView = ArticlePin & {
  body: string
}

export function mapArticlePin(row: ArticleRow): ArticlePin {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    latitude: row.latitude,
    longitude: row.longitude,
    categoryId: row.category_id,
    categories: sortFiledCategories(row.filed).map((topic) => ({ id: topic.id, name: topic.name })),
    tags: row.tags,
    publishedAt: row.published_at.toISOString(),
    isBreaking: row.is_breaking,
  }
}

export function mapArticle(row: ArticleRow): ArticleView {
  return {
    ...mapArticlePin(row),
    body: row.body,
  }
}
