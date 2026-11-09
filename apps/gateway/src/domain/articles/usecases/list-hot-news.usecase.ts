import { getConfig } from '../../../lib/context.ts'
import { mapArticle, type Article } from '../articles.mappers.ts'
import { getArticleRepository } from '../articles.repository.ts'
import { publishedAfter } from '../news-window.ts'

export async function listHotNews(country: string, windowHours?: number): Promise<{ articles: Article[] }> {
  const config = getConfig()
  const repository = getArticleRepository()
  const rows = await repository.listHotByCountry({
    countryCode: country,
    publishedAfter: publishedAfter(config.feedRetentionDays, windowHours),
    limit: config.hotNewsCap,
  })
  const articles = rows.map(mapArticle)
  return { articles }
}
