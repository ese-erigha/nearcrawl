import { getConfig } from '../../../lib/context.ts'
import { mapArticlePin, type ArticlePin } from '../articles.mappers.ts'
import { getArticleRepository } from '../articles.repository.ts'

const DAY_MS = 86_400_000

export async function listHotNews(country: string): Promise<{ articles: ArticlePin[] }> {
  const config = getConfig()
  const repository = getArticleRepository()
  const publishedAfter = new Date(Date.now() - config.feedRetentionDays * DAY_MS)
  const rows = await repository.listHotByCountry({
    countryCode: country,
    publishedAfter,
    limit: config.hotNewsCap,
  })
  const articles = rows.map(mapArticlePin)
  return { articles }
}
