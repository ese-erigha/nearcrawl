import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'

import { NotFoundError } from '../../../lib/errors.ts'

let found = true

mock.module('../articles.repository.ts', {
  namedExports: {
    getArticleRepository: () => ({
      findInBBox: async () => ({ rows: [], truncated: false }),
      findById: async () => (found ? { id: 'present' } : null),
    }),
  },
})

const { getArticle } = await import('./get-article.usecase.ts')

describe('getArticle', () => {
  it('throws when the repository has no row', async () => {
    found = false
    await assert.rejects(() => getArticle('00000000-0000-4000-8000-000000000000'), NotFoundError)
  })
})
