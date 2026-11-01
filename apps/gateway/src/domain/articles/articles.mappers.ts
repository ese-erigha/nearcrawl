import { sortFiledCategories } from 'db'

import type { ArticleRow, FiledTopic } from './articles.types.ts'

export type ArticlePin = {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  faviconUrl: string | null
  sourceName: string
  sourceUrl: string
  latitude: number
  longitude: number
  categoryId: number
  categories: FiledTopic[]
  tags: string[]
  publishedAt: string
  isBreaking: boolean
  readTimeMinutes: number | null
  isFree: boolean | null
  shareCount: number
}

export type ArticleView = ArticlePin & {
  body: string
  bodyHtml: string | null
  authorName: string | null
  sourceHomeUrl: string | null
  sourceCountryName: string | null
  sourceCountryCode: string | null
  wordsCount: number | null
}

export function mapArticlePin(row: ArticleRow): ArticlePin {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    faviconUrl: row.favicon_url,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    latitude: row.latitude,
    longitude: row.longitude,
    categoryId: row.category_id,
    categories: sortFiledCategories(row.filed).map((topic) => ({ id: topic.id, name: topic.name })),
    tags: row.tags,
    publishedAt: row.published_at.toISOString(),
    isBreaking: row.is_breaking,
    readTimeMinutes: row.read_time_minutes,
    isFree: row.is_free,
    shareCount: row.share_count,
  }
}

export function mapArticle(row: ArticleRow): ArticleView {
  return {
    ...mapArticlePin(row),
    body: row.body,
    bodyHtml: row.body_html,
    authorName: row.author_name,
    sourceHomeUrl: row.source_home_url,
    sourceCountryName: row.source_country_name,
    sourceCountryCode: row.source_country_code,
    wordsCount: row.words_count,
  }
}
