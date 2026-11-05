import { sortFiledCategories } from 'db'

import type { ArticleRow, FiledTopic } from './articles.types.ts'

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

export function mapArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    body: row.body,
    bodyHtml: row.body_html,
    imageUrl: row.image_url,
    faviconUrl: row.favicon_url,
    authorName: row.author_name,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    sourceHomeUrl: row.source_home_url,
    sourceCountryName: row.source_country_name,
    sourceCountryCode: row.source_country_code,
    latitude: row.latitude,
    longitude: row.longitude,
    categoryId: row.category_id,
    categories: sortFiledCategories(row.filed).map((topic) => ({ id: topic.id, name: topic.name })),
    countryCodes: row.country_codes,
    tags: row.tags,
    publishedAt: row.published_at.toISOString(),
    isBreaking: row.is_breaking,
    readTimeMinutes: row.read_time_minutes,
    wordsCount: row.words_count,
    isFree: row.is_free,
    shareCount: row.share_count,
    sourceRank: row.source_rank,
    storyId: row.story_id,
  }
}
