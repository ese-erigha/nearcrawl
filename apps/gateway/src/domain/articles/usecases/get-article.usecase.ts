import { NotFoundError } from '../../../lib/errors.ts'
import { mapArticle, type Article } from '../articles.mappers.ts'
import { getArticleRepository } from '../articles.repository.ts'

export async function getArticle(id: string): Promise<Article> {
  const repository = getArticleRepository()
  const row = await repository.findById(id)
  if (!row) {
    throw new NotFoundError('Article not found')
  }
  return mapArticle(row)
}
