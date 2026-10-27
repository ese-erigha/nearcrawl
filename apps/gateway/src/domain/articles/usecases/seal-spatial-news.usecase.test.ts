import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'

import { LiveQuerySealerMissingError } from '../../../lib/errors.ts'

let sealer: { seal: (query: unknown) => Promise<unknown> } | null = null

mock.module('../live-query-sealer.ts', {
  namedExports: {
    getLiveQuerySealer: () => sealer,
  },
})

mock.module('../../../lib/context.ts', {
  namedExports: {
    getConfig: () => ({ spatialNewsCap: 1 }),
  },
})

const { sealSpatialNews } = await import('./seal-spatial-news.usecase.ts')

describe('sealSpatialNews', () => {
  it('when the sealer is configured, then the response contains the sealed query', async () => {
    sealer = {
      seal: async () => ({ capability: 'sealed' }),
    }
    const response = await sealSpatialNews({
      bbox: { west: -10, south: -20, east: 10, north: 30 },
    })
    assert.deepEqual(response.sealedQuery, { capability: 'sealed' })
  })

  it('when the sealer is missing, then seal throws', async () => {
    sealer = null
    await assert.rejects(
      () => sealSpatialNews({ bbox: { west: -10, south: -20, east: 10, north: 30 } }),
      LiveQuerySealerMissingError,
    )
  })
})
