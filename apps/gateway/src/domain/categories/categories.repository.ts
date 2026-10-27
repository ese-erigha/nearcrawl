import { getConfig } from '../../lib/context.ts'
import { MemoryCategoryRepository } from './memory-category.repository.ts'
import { DbCategoryRepository } from './db-category.repository.ts'
import type { CategoryRepository } from './categories.types.ts'

export function getCategoryRepository(): CategoryRepository {
  const databaseUrl = getConfig().databaseUrl
  if (!databaseUrl) {
    return new MemoryCategoryRepository()
  }
  return new DbCategoryRepository(databaseUrl)
}
