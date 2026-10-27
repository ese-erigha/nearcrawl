import { getConfig } from '../../../lib/context.ts'
import { mapArticlePin, type ArticlePin } from '../articles.mappers.ts'
import { getArticleRepository } from '../articles.repository.ts'
import type { SpatialNewsInput } from '../articles.validation.ts'

export async function listSpatialNews(
  input: SpatialNewsInput,
): Promise<{ articles: ArticlePin[]; truncated: boolean }> {
  const config = getConfig()
  const repository = getArticleRepository()
  const result = await repository.findInBBox({
    bbox: input.bbox,
    categoryId: input.categoryId,
    limit: config.spatialNewsCap,
  })
  const articles = result.rows.map(mapArticlePin)
  return { articles, truncated: result.truncated }
}
