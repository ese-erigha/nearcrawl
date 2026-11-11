import { logger } from '@sentry/hono/cloudflare'
import { z } from 'zod'

import { postInferenceJson } from '../../lib/inference-json.ts'
import { getConfig } from '../../lib/context.ts'
import type { Article } from '../articles/articles.mappers.ts'
import { listHotNews } from '../articles/usecases/list-hot-news.usecase.ts'

const TITLE_LIMIT = 500
const SOURCE_LIMIT = 200
const DESCRIPTION_LIMIT = 500

const summarySchema = z.object({ summary: z.string() }).strict()

export async function getDailyBrief(country: string): Promise<{ articles: Article[]; summary: string }> {
  const config = getConfig()
  const listed = await listHotNews(country, config.briefWindowHours)
  if (listed.articles.length === 0) return { articles: [], summary: '' }
  const summary = await summarizeStories(listed.articles)
  return { articles: listed.articles, summary }
}

async function summarizeStories(articles: Article[]): Promise<string> {
  const payload = { stories: articles.map(storyForModel) }
  logger.info('brief payload', { payload: JSON.stringify(payload) })
  const body = await postInferenceJson('/brief-summaries', payload)
  logger.info('brief body', { body: JSON.stringify(body) })
  const parsed = summarySchema.safeParse(body)
  if (!parsed.success) return ''
  return parsed.data.summary.trim()
}

function storyForModel(article: Article): { title: string; sourceName: string; description: string } {
  return {
    title: article.title.slice(0, TITLE_LIMIT),
    sourceName: article.sourceName.slice(0, SOURCE_LIMIT),
    description: (article.description ?? '').slice(0, DESCRIPTION_LIMIT),
  }
}
