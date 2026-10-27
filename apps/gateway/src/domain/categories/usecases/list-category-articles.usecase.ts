import { NotFoundError } from '../../../lib/errors.ts'
import { mapArticlePin, type ArticlePin } from '../../articles/articles.mappers.ts'
import { getArticleRepository } from '../../articles/articles.repository.ts'
import { getCategoryRepository } from '../categories.repository.ts'

export async function listCategoryArticles(
  id: number,
  limit: number,
): Promise<{ articles: ArticlePin[] }> {
  const categories = getCategoryRepository()
  const detail = await categories.findWithChildren(id)
  if (!detail) {
    throw new NotFoundError('Category not found')
  }
  const articles = getArticleRepository()
  const rows = await articles.listByCategory(id, limit)
  return { articles: rows.map(mapArticlePin) }
}
