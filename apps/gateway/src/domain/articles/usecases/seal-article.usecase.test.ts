import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'

import { NotFoundError } from '../../../lib/errors.ts'

let present = true

mock.module('../articles.repository.ts', {
  namedExports: {
    getArticleRepository: () => ({
      findById: async () => (present ? { id: 'present' } : null),
    }),
  },
})

mock.module('../live-query-sealer.ts', {
  namedExports: {
    getLiveQuerySealer: () => ({
      seal: async () => ({ capability: 'article' }),
    }),
  },
})

const { sealArticle } = await import('./seal-article.usecase.ts')

describe('sealArticle', () => {
  it('throws before sealing when the article is missing', async () => {
    present = false
    await assert.rejects(() => sealArticle('00000000-0000-4000-8000-000000000000'), NotFoundError)
  })
})
