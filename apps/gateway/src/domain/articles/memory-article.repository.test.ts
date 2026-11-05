import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { CATEGORY, categoryCatalog } from 'db'

import { MemoryArticleRepository } from './memory-article.repository.ts'
import type { ArticleRow } from './articles.types.ts'

function row(overrides: Partial<ArticleRow> & Pick<ArticleRow, 'id' | 'latitude' | 'longitude'>): ArticleRow {
  return {
    title: overrides.id,
    description: 'Summary',
    body: 'Body',
    body_html: null,
    image_url: null,
    favicon_url: null,
    author_name: null,
    source_name: 'Desk',
    source_url: 'https://example.com',
    source_home_url: null,
    source_country_name: null,
    source_country_code: null,
    category_id: CATEGORY.GENERAL,
    filed: [{ id: CATEGORY.GENERAL, name: 'General' }],
    tags: [],
    published_at: new Date('2026-10-26T12:00:00.000Z'),
    is_breaking: false,
    is_free: null,
    is_duplicate: false,
    share_count: 0,
    read_time_minutes: null,
    words_count: null,
    source_rank: null,
    story_id: null,
    country_codes: [],
    ...overrides,
  }
}

describe('MemoryArticleRepository', () => {
  it('returns a pin inside the box', async () => {
    const repository = new MemoryArticleRepository([
      row({ id: 'inside', latitude: 1, longitude: 2 }),
      row({ id: 'outside', latitude: 40, longitude: 2 }),
    ])

    const result = await repository.findInBBox({
      bbox: { west: 0, south: 0, east: 10, north: 10 },
      limit: 200,
    })

    assert.deepEqual(result.rows.map((item) => item.id), ['inside'])
    assert.equal(result.truncated, false)
  })

  it('filters by category and by a subcategory', async () => {
    const centralBank = categoryCatalog.find((item) => item.medtopId === 'medtop:20000350')
    assert.ok(centralBank)
    const repository = new MemoryArticleRepository([
      row({
        id: 'finance',
        latitude: 1,
        longitude: 2,
        category_id: CATEGORY.FINANCE,
        filed: [
          { id: CATEGORY.FINANCE, name: 'Finance' },
          { id: centralBank.id, name: 'central bank' },
        ],
      }),
      row({
        id: 'tech',
        latitude: 1,
        longitude: 2,
        category_id: CATEGORY.TECH,
        filed: [{ id: CATEGORY.TECH, name: 'Tech' }],
      }),
    ])

    const finance = await repository.findInBBox({
      bbox: { west: 0, south: 0, east: 10, north: 10 },
      categoryId: CATEGORY.FINANCE,
      limit: 200,
    })
    const centralBankRows = await repository.listByCategory(centralBank.id, 20)

    assert.deepEqual(finance.rows.map((item) => item.id), ['finance'])
    assert.deepEqual(centralBankRows.map((item) => item.id), ['finance'])
  })

  it('includes longitudes on either side of the antimeridian', async () => {
    const repository = new MemoryArticleRepository([
      row({ id: 'west-edge', latitude: 1, longitude: 175 }),
      row({ id: 'east-edge', latitude: 1, longitude: -175 }),
      row({ id: 'middle', latitude: 1, longitude: 0 }),
    ])

    const result = await repository.findInBBox({
      bbox: { west: 170, south: -10, east: -170, north: 10 },
      limit: 200,
    })

    assert.deepEqual(result.rows.map((item) => item.id).sort(), ['east-edge', 'west-edge'])
  })

  it('caps the page and marks it truncated', async () => {
    const rows = Array.from({ length: 201 }, (_, index) =>
      row({
        id: `id-${String(index).padStart(3, '0')}`,
        latitude: 1,
        longitude: 2,
        published_at: new Date(Date.UTC(2026, 0, 1, 0, 0, index)),
      }),
    )
    const repository = new MemoryArticleRepository(rows)

    const result = await repository.findInBBox({
      bbox: { west: 0, south: 0, east: 10, north: 10 },
      limit: 200,
    })

    assert.equal(result.rows.length, 200)
    assert.equal(result.truncated, true)
    assert.equal(result.rows[0]?.id, 'id-200')
  })

  it('when the hot country is FR, then a duplicate is excluded and a breaking story comes before a story with more shares', async () => {
    const repository = new MemoryArticleRepository([
      row({
        id: 'duplicate',
        latitude: 1,
        longitude: 2,
        is_duplicate: true,
        is_breaking: true,
        share_count: 100,
        country_codes: ['FR'],
      }),
      row({
        id: 'shares',
        latitude: 1,
        longitude: 2,
        is_breaking: false,
        share_count: 50,
        country_codes: ['FR'],
      }),
      row({
        id: 'breaking',
        latitude: 1,
        longitude: 2,
        is_breaking: true,
        share_count: 1,
        country_codes: ['FR'],
      }),
      row({
        id: 'united-states',
        latitude: 1,
        longitude: 2,
        is_breaking: true,
        share_count: 99,
        country_codes: ['US'],
      }),
    ])

    const rows = await repository.listHotByCountry({
      countryCode: 'FR',
      publishedAfter: new Date('2026-01-01T00:00:00.000Z'),
      limit: 20,
    })

    assert.deepEqual(
      rows.map((item) => item.id),
      ['breaking', 'shares'],
    )
  })
})
