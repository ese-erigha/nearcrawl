import { getConfig } from '../../lib/context.ts'
import { MemoryArticleRepository } from './memory-article.repository.ts'
import { DbArticleRepository } from './db-article.repository.ts'
import type { ArticleRepository } from './articles.types.ts'

export function getArticleRepository(): ArticleRepository {
  const databaseUrl = getConfig().databaseUrl
  if (!databaseUrl) {
    return new MemoryArticleRepository()
  }
  return new DbArticleRepository(databaseUrl)
}
