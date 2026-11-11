import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'

import type { Article } from '../articles/articles.mappers.ts'

const article = {
  title: 'Port closure',
  sourceName: 'Harbor Desk',
  description: 'Shipping halted overnight.',
  body: 'Night traffic stopped.',
} as Article

mock.module('../../lib/context.ts', {
  namedExports: {
    getConfig: () => ({ briefWindowHours: 48 }),
  },
})

mock.module('../articles/usecases/list-hot-news.usecase.ts', {
  namedExports: {
    listHotNews: async () => ({ articles: [article] }),
  },
})

mock.module('../../lib/inference-json.ts', {
  namedExports: {
    postInferenceJson: async () => null,
  },
})

const { getDailyBrief } = await import('./get-daily-brief.usecase.ts')

describe('getDailyBrief', () => {
  it('when the model is down, then the brief returns the stories and an empty summary', async () => {
    const response = await getDailyBrief('CA')
    assert.equal(response.articles[0]?.title, 'Port closure')
    assert.equal(response.summary, '')
  })
})
