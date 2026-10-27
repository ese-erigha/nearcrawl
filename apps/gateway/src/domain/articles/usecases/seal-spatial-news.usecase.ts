import { compileSql, spatialNewsSql } from 'db'

import { getConfig } from '../../../lib/context.ts'
import { LiveQuerySealerMissingError } from '../../../lib/errors.ts'
import { getLiveQuerySealer } from '../live-query-sealer.ts'
import type { SpatialNewsInput } from '../articles.validation.ts'

export async function sealSpatialNews(input: SpatialNewsInput): Promise<{ sealedQuery: unknown }> {
  const sealer = getLiveQuerySealer()
  if (!sealer) {
    throw new LiveQuerySealerMissingError()
  }

  const config = getConfig()
  const compiled = compileSql(
    spatialNewsSql({
      west: input.bbox.west,
      south: input.bbox.south,
      east: input.bbox.east,
      north: input.bbox.north,
      categoryId: input.categoryId ?? null,
      limit: config.spatialNewsCap,
    }),
  )
  const sealedQuery = await sealer.seal(compiled)
  return { sealedQuery }
}
