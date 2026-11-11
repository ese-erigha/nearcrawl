import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'

import type { Article } from '../articles/articles.mappers.ts'

const article = {
  title: 'Port closure',
  sourceName: 'Harbor Desk',
  description: `${'Shipping halted. '.repeat(40)}`,
  body: 'The full scraped page stays off the model request.',
} as Article

const sent: { path?: string; payload?: unknown; country?: string; windowHours?: number } = {}

mock.module('../../lib/context.ts', {
  namedExports: {
    getConfig: () => ({ briefWindowHours: 48 }),
  },
})

mock.module('../articles/usecases/list-hot-news.usecase.ts', {
  namedExports: {
    listHotNews: async (country: string, windowHours?: number) => {
      sent.country = country
      sent.windowHours = windowHours
      return { articles: [article] }
    },
  },
})

mock.module('../../lib/inference-json.ts', {
  namedExports: {
    postInferenceJson: async (path: string, payload: unknown) => {
      sent.path = path
      sent.payload = payload
      return { summary: '  Ports closed overnight.  ' }
    },
  },
})

const { getDailyBrief } = await import('./get-daily-brief.usecase.ts')

describe('getDailyBrief', () => {
  it('when the country brief loads, then the model sees the clipped stories from that one read', async () => {
    const response = await getDailyBrief('ca')
    const payload = sent.payload as { stories: { title: string; sourceName: string; description: string }[] }
    const story = payload.stories[0]

    assert.equal(sent.country, 'ca')
    assert.equal(sent.windowHours, 48)
    assert.equal(sent.path, '/brief-summaries')
    assert.equal(story?.title, 'Port closure')
    assert.equal(story?.sourceName, 'Harbor Desk')
    assert.equal(story?.description.length, 500)
    assert.equal('body' in (story ?? {}), false)
    assert.equal(response.summary, 'Ports closed overnight.')
    assert.equal(response.articles[0]?.body, article.body)
  })
})
