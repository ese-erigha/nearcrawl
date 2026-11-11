import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'

import { CATEGORY } from 'db'

import type { ArticleRow, HotNewsQuery } from '../articles.types.ts'

const calls: string[][] = []
const pages: Record<string, ArticleRow[]> = {}

function row(id: string, shareCount: number, isBreaking: boolean, countryCodes: string[]): ArticleRow {
  return {
    id,
    title: id,
    description: null,
    body: 'Body',
    body_html: null,
    image_url: null,
    favicon_url: null,
    author_name: null,
    source_name: 'Desk',
    source_url: 'https://example.com/story',
    source_home_url: null,
    source_country_name: null,
    source_country_code: null,
    latitude: 0,
    longitude: 0,
    category_id: CATEGORY.POLITICS,
    filed: [{ id: CATEGORY.POLITICS, name: 'Politics' }],
    tags: [],
    published_at: new Date('2026-11-11T00:00:00.000Z'),
    is_breaking: isBreaking,
    is_free: true,
    is_duplicate: false,
    share_count: shareCount,
    read_time_minutes: null,
    words_count: null,
    source_rank: null,
    story_id: null,
    country_codes: countryCodes,
  }
}

function page(code: string, count: number, shareStart: number): ArticleRow[] {
  return Array.from({ length: count }, (_, index) => row(`${code}-${index}`, shareStart - index, false, [code]))
}

mock.module('../articles.repository.ts', {
  namedExports: {
    getArticleRepository: () => ({
      listHotByCountry: async (query: HotNewsQuery) => {
        calls.push([...query.countryCodes])
        return query.countryCodes.flatMap((code) => pages[code] ?? [])
      },
    }),
  },
})

mock.module('../../../lib/context.ts', {
  namedExports: {
    getConfig: () => ({ hotNewsCap: 20, feedRetentionDays: 14 }),
  },
})

const { listHotNews } = await import('./list-hot-news.usecase.ts')

function countCode(articles: { countryCodes: string[] }[], code: string): number {
  return articles.filter((article) => article.countryCodes.includes(code)).length
}

describe('listHotNews', { concurrency: false }, () => {
  it('when two countries each fill a page, then each country keeps half of the cap', async () => {
    calls.length = 0
    pages.AF = page('AF', 20, 100)
    pages.AR = page('AR', 20, 50)
    const response = await listHotNews(['AF', 'AR'])

    assert.deepEqual(calls, [['AF', 'AR']])
    assert.equal(response.articles.length, 20)
    assert.equal(countCode(response.articles, 'AF'), 10)
    assert.equal(countCode(response.articles, 'AR'), 10)
    assert.equal(response.articles[0]?.id, 'AF-0')
  })

  it('when one country has fewer stories than its share, then the spare slots go to the other country', async () => {
    pages.AF = page('AF', 4, 10)
    pages.AR = page('AR', 20, 100)
    const response = await listHotNews(['AF', 'AR'])

    assert.equal(response.articles.length, 20)
    assert.equal(countCode(response.articles, 'AF'), 4)
    assert.equal(countCode(response.articles, 'AR'), 16)
  })

  it('when the same story is in both countries, then the hot list keeps it once', async () => {
    pages.JP = [row('shared', 1, false, ['JP', 'CA'])]
    pages.CA = [row('shared', 1, false, ['JP', 'CA'])]
    const response = await listHotNews(['JP', 'CA'])

    assert.equal(response.articles.length, 1)
    assert.equal(response.articles[0]?.id, 'shared')
  })

  it('when the same country is repeated, then the hot list reads it once', async () => {
    calls.length = 0
    pages.JP = page('JP', 1, 1)
    await listHotNews(['JP', 'JP'])

    assert.deepEqual(calls, [['JP']])
  })
})
