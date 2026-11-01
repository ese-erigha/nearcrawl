import { DbArticleRepository } from 'db'

import { getIngestionConfig } from '../config.ts'

export async function purgeArticles(): Promise<number> {
  const config = getIngestionConfig()
  const articles = new DbArticleRepository(config.databaseUrl)
  return articles.purgeOlderThan(config.retentionDays)
}
