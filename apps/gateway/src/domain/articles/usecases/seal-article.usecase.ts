import { LiveQuerySealerMissingError, NotFoundError } from '../../../lib/errors.ts'
import { articleByIdSql, compileSql } from 'db'
import { getArticleRepository } from '../articles.repository.ts'
import { getLiveQuerySealer } from '../live-query-sealer.ts'

export async function sealArticle(id: string): Promise<{ sealedQuery: unknown }> {
  const repository = getArticleRepository()
  const row = await repository.findById(id)
  if (!row) {
    throw new NotFoundError('Article not found')
  }

  const sealer = getLiveQuerySealer()
  if (!sealer) {
    throw new LiveQuerySealerMissingError()
  }

  const compiled = compileSql(articleByIdSql(id))
  const sealedQuery = await sealer.seal(compiled)
  return { sealedQuery }
}
