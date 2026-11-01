import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'

import { DAY_MS, runWithConfig, type IngestionConfig } from '../config.ts'
import type { NewsItem, NewsPage, NewsTopic } from './apitube.client.ts'

const batches: Array<Array<{ apitubeId: string; categoryId: number; categoryIds: number[] }>> = []
const inserts: Array<{ name: string; parentId: number; medtopId: string }> = []
const calls: number[] = []
let pages: NewsPage[] = []

mock.module('db', {
  namedExports: {
    DbArticleRepository: class {
      upsertByApitubeIds(articles: Array<{ apitubeId: string; categoryId: number; categoryIds: number[] }>) {
        batches.push(articles)
        return Promise.resolve()
      }
    },
    DbCategoryRepository: class {
      listForFiling() {
        return Promise.resolve([
          { id: 1, parentId: null, medtopId: 'medtop:01000000' },
          { id: 6, parentId: null, medtopId: 'medtop:04000000' },
          { id: 18, parentId: null, medtopId: null },
          { id: 49, parentId: 6, medtopId: 'medtop:20000344' },
          { id: 204, parentId: 49, medtopId: 'medtop:20000350' },
        ])
      }

      insertByMedtop(category: { name: string; parentId: number; medtopId: string }) {
        inserts.push(category)
        return Promise.resolve({ id: 1087, parentId: category.parentId, medtopId: category.medtopId })
      }
    },
  },
})

mock.module('./apitube.client.ts', {
  namedExports: {
    listNewsPage: (page: number) => {
      calls.push(page)
      const empty: NewsPage = { items: [], dropped: 0, hasNextPage: false }
      return Promise.resolve(pages[page - 1] ?? empty)
    },
  },
})

const { pullNews } = await import('./pull-news.ts')

const config: IngestionConfig = {
  databaseUrl: 'postgres://local/test',
  apitubeApiKey: 'test-key',
  retentionDays: 14,
  intervalMinutes: 17,
  maxPages: 100,
  sentryDsn: '',
  sentryEnvironment: undefined,
}

function item(overrides: Partial<NewsItem> = {}): NewsItem {
  const medtopIds = overrides.medtopIds ?? ['medtop:20000350']
  const topics: NewsTopic[] =
    overrides.topics ?? medtopIds.map((medtopId) => ({ medtopId, name: null, parentMedtopId: null }))
  return {
    apitubeId: 'abc',
    title: 'Headline',
    summary: 'Short',
    body: 'Body',
    sourceName: 'example.com',
    sourceUrl: 'https://example.com/a',
    latitude: 1.3,
    longitude: 103.8,
    tags: [],
    publishedAt: new Date(),
    isBreaking: false,
    storyId: null,
    ...overrides,
    topics,
    medtopIds: topics.map((topic) => topic.medtopId),
  }
}

function reset(): void {
  batches.length = 0
  inserts.length = 0
  calls.length = 0
  pages = []
}

function captureWarnings(t: { after: (fn: () => void) => void }): string[] {
  const warnings: string[] = []
  const original = console.warn
  console.warn = (message?: unknown) => {
    warnings.push(String(message))
  }
  t.after(() => {
    console.warn = original
  })
  return warnings
}

describe('pullNews', () => {
  it('when an item has no coordinates, then the pull warns and skips the write', async (t) => {
    reset()
    const warnings = captureWarnings(t)
    pages = [{ items: [item({ latitude: null, longitude: null })], dropped: 0, hasNextPage: false }]
    const counts = await runWithConfig(config, () => pullNews())
    assert.deepEqual(batches, [])
    assert.equal(counts.pulled, 1)
    assert.equal(counts.upserted, 0)
    assert.equal(counts.skipped, 1)
    assert.equal(warnings[0], 'article skipped, apitube id abc, medtop ids medtop:20000350')
  })

  it('when a coordinate is outside the article checks, then the pull warns and skips the write', async (t) => {
    reset()
    const warnings = captureWarnings(t)
    pages = [{ items: [item({ latitude: 91 })], dropped: 0, hasNextPage: false }]
    const counts = await runWithConfig(config, () => pullNews())
    assert.deepEqual(batches, [])
    assert.equal(counts.skipped, 1)
    assert.equal(warnings.length, 1)
  })

  it('when a page has two articles, then the pull writes them in one batch', async () => {
    reset()
    pages = [
      {
        items: [item(), item({ apitubeId: 'def', medtopIds: ['medtop:01000000'] })],
        dropped: 0,
        hasNextPage: false,
      },
    ]
    await runWithConfig(config, () => pullNews())
    assert.equal(batches.length, 1)
    assert.equal(batches[0]?.length, 2)
    assert.equal(batches[0]?.[0]?.categoryId, 6)
    assert.equal(batches[0]?.[1]?.categoryId, 1)
  })

  it('when the same apitube id arrives twice on a page, then the batch keeps the later filing', async () => {
    reset()
    pages = [
      {
        items: [item({ medtopIds: ['medtop:20000350'] }), item({ medtopIds: ['medtop:01000000'] })],
        dropped: 0,
        hasNextPage: false,
      },
    ]
    await runWithConfig(config, () => pullNews())
    assert.equal(batches.length, 1)
    assert.equal(batches[0]?.length, 1)
    assert.equal(batches[0]?.[0]?.categoryId, 1)
    assert.deepEqual(batches[0]?.[0]?.categoryIds, [1])
  })

  it('when an article has an unknown topic, then the pull warns once and files the known topic', async (t) => {
    reset()
    const warnings = captureWarnings(t)
    pages = [
      {
        items: [item({ medtopIds: ['medtop:20000350', 'medtop:99999999'] })],
        dropped: 0,
        hasNextPage: false,
      },
    ]
    const counts = await runWithConfig(config, () => pullNews())
    assert.equal(counts.unknownTopics, 1)
    assert.equal(counts.upserted, 1)
    assert.equal(batches[0]?.[0]?.categoryId, 6)
    assert.equal(warnings[0], 'unknown medtop medtop:99999999')
  })

  it('when two articles share an unknown topic, then the pull warns once', async (t) => {
    reset()
    const warnings = captureWarnings(t)
    pages = [
      {
        items: [
          item({ apitubeId: 'abc', medtopIds: ['medtop:99999999'] }),
          item({ apitubeId: 'def', medtopIds: ['medtop:99999999'] }),
        ],
        dropped: 0,
        hasNextPage: false,
      },
    ]
    const counts = await runWithConfig(config, () => pullNews())
    assert.equal(counts.unknownTopics, 1)
    assert.equal(counts.upserted, 2)
    assert.deepEqual(warnings, ['unknown medtop medtop:99999999'])
  })

  it('when a topic names a parent already in the index, then the pull inserts that category and files its chain', async () => {
    reset()
    const topic = {
      medtopId: 'medtop:20009999',
      name: 'digital currency',
      parentMedtopId: 'medtop:20000350',
    }
    pages = [{ items: [item({ topics: [topic] })], dropped: 0, hasNextPage: false }]
    const counts = await runWithConfig(config, () => pullNews())
    assert.deepEqual(inserts, [{ name: 'digital currency', parentId: 204, medtopId: 'medtop:20009999' }])
    assert.equal(counts.unknownTopics, 0)
    assert.equal(counts.upserted, 1)
    assert.equal(batches[0]?.[0]?.categoryId, 6)
    assert.deepEqual(batches[0]?.[0]?.categoryIds, [1087, 204, 49, 6])
  })

  it('when every item on the page is older than the feed window, then the pull stops', async () => {
    reset()
    pages = [
      {
        items: [item({ publishedAt: new Date(Date.now() - 40 * DAY_MS) })],
        dropped: 0,
        hasNextPage: true,
      },
      { items: [item()], dropped: 0, hasNextPage: false },
    ]
    const counts = await runWithConfig(config, () => pullNews())
    assert.deepEqual(calls, [1])
    assert.deepEqual(batches, [])
    assert.equal(counts.upserted, 0)
    assert.equal(counts.skipped, 0)
  })
})
