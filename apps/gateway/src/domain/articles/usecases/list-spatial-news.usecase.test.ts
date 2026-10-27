import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'

import { CATEGORY } from 'db'

import type { ArticleRow } from '../articles.types.ts'

const row: ArticleRow = {
  id: '6b1c0c3e-1f4a-4a0e-9c1d-2a6f0b9e8d11',
  title: 'Port closure',
  summary: 'Shipping halted overnight.',
  body: 'The port stopped night traffic after the channel was closed.',
  source_name: 'Harbor Desk',
  source_url: 'https://example.com/port',
  latitude: 1.3,
  longitude: 103.8,
  category_id: CATEGORY.POLITICS,
  filed: [{ id: CATEGORY.POLITICS, name: 'Politics' }],
  tags: ['shipping'],
  published_at: new Date('2026-10-26T12:00:00.000Z'),
  is_breaking: false,
}

mock.module('../articles.repository.ts', {
  namedExports: {
    getArticleRepository: () => ({
      findInBBox: async () => ({ rows: [row], truncated: false }),
      findById: async () => row,
    }),
  },
})

mock.module('../../../lib/context.ts', {
  namedExports: {
    getConfig: () => ({ spatialNewsCap: 1 }),
  },
})

const { listSpatialNews } = await import('./list-spatial-news.usecase.ts')

describe('listSpatialNews', () => {
  it('when a row is in the box, then the response is a pin', async () => {
    const response = await listSpatialNews({
      bbox: { west: 103, south: 1, east: 104, north: 2 },
    })

    assert.equal(response.truncated, false)
    assert.equal(response.articles[0]?.sourceName, 'Harbor Desk')
    assert.equal(response.articles[0]?.publishedAt, '2026-10-26T12:00:00.000Z')
    assert.equal('body' in (response.articles[0] ?? {}), false)
  })
})
