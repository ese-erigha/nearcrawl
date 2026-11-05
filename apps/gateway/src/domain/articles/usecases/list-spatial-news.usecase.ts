import { requireKnownCategory } from '../../categories/require-known-category.ts'
import { getConfig } from '../../../lib/context.ts'
import { mapArticle, type Article } from '../articles.mappers.ts'
import { getArticleRepository } from '../articles.repository.ts'
import type { SpatialNewsInput } from '../spatial-news.schema.ts'

export async function listSpatialNews(
  input: SpatialNewsInput,
): Promise<{ articles: Article[]; truncated: boolean }> {
  await requireKnownCategory(input.categoryId)
  const config = getConfig()
  const repository = getArticleRepository()
  const result = await repository.findInBBox({
    bbox: input.bbox,
    categoryId: input.categoryId,
    limit: config.spatialNewsCap,
  })
  const articles = result.rows.map(mapArticle)
  return { articles, truncated: result.truncated }
}
