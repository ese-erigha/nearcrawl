import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { DbArticleRepository } from './article.repository.ts'
import {
  compileSql,
  existingApitubeIdsSql,
  purgeArticlesSql,
  hotNewsSql,
  spatialNewsSql,
  upsertArticlesSql,
  type UpsertArticle,
} from './articles.sql.ts'

const article: UpsertArticle = {
  apitubeId: 'abc',
  title: 'Headline',
  description: 'Short',
  body: 'Long',
  bodyHtml: null,
  imageUrl: null,
  faviconUrl: null,
  authorName: null,
  sourceName: 'example.com',
  sourceUrl: 'https://example.com/a',
  sourceHomeUrl: null,
  sourceCountryName: null,
  sourceCountryCode: null,
  latitude: 1.3,
  longitude: 103.8,
  categoryId: 6,
  categoryIds: [204, 49, 6],
  filedCategories: [
    { categoryId: 204, score: 0.4 },
    { categoryId: 49, score: 0.4 },
    { categoryId: 6, score: 0.4 },
  ],
  countryCodes: ['SG'],
  tags: [],
  publishedAt: new Date('2026-10-28T00:00:00.000Z'),
  isBreaking: false,
  isFree: null,
  isDuplicate: false,
  shareCount: 0,
  readTimeMinutes: null,
  wordsCount: null,
  sourceRank: null,
  storyId: null,
}

describe('upsertArticlesSql', () => {
  it('when the same apitube id is written again, then the statement updates that row and replaces the join rows', () => {
    const first = compileSql(upsertArticlesSql([article]))
    const second = compileSql(
      upsertArticlesSql([
        {
          ...article,
          categoryId: 1,
          categoryIds: [1],
          filedCategories: [{ categoryId: 1, score: 0.1 }],
        },
      ]),
    )

    assert.match(first.sql, /ON CONFLICT \(apitube_id\) DO UPDATE/)
    assert.match(first.sql, /NOT EXISTS/)
    assert.match(first.sql, /ON CONFLICT \(article_id, category_id\) DO UPDATE SET score/)
    assert.equal(first.sql.includes('ingested_at'), false)
    assert.equal(first.sql.includes('now()'), false)
    assert.equal(first.params.includes(204), true)
    assert.equal(first.params.includes(49), true)
    assert.equal(first.params.includes(6), true)
    assert.equal(second.params.includes(1), true)
    assert.equal(second.params.includes(204), false)
  })

  it('when a page has two articles, then the statement binds both apitube ids', () => {
    const compiled = compileSql(
      upsertArticlesSql([
        article,
        {
          ...article,
          apitubeId: 'def',
          categoryId: 1,
          categoryIds: [1],
          filedCategories: [{ categoryId: 1, score: null }],
        },
      ]),
    )

    assert.equal(compiled.params.includes('abc'), true)
    assert.equal(compiled.params.includes('def'), true)
    assert.equal(compiled.sql.includes('ingested_at'), false)
    assert.equal(compiled.sql.includes('now()'), false)
  })

  it('when a page is written, then latitude, the time, and the breaking flag keep their column types', () => {
    const compiled = compileSql(upsertArticlesSql([article]))

    assert.match(compiled.sql, /::float8/)
    assert.match(compiled.sql, /::timestamptz/)
    assert.match(compiled.sql, /::boolean/)
    assert.match(compiled.sql, /::int/)
  })

  it('when a repeat pull sends a new score, then the statement updates the score', () => {
    const compiled = compileSql(upsertArticlesSql([article]))

    assert.match(compiled.sql, /DO UPDATE SET score = EXCLUDED.score/)
    assert.equal(compiled.params.includes(0.4), true)
  })
})

describe('hotNewsSql', () => {
  it('when the hot country is FR, then a duplicate is excluded and breaking comes before share count', () => {
    const compiled = compileSql(
      hotNewsSql({
        countryCode: 'FR',
        publishedAfter: new Date('2026-10-01T00:00:00.000Z'),
        limit: 20,
      }),
    )

    assert.match(compiled.sql, /is_duplicate = false/)
    assert.match(compiled.sql, /is_breaking DESC, articles.share_count DESC, articles.published_at DESC/)
    assert.equal(compiled.sql.includes('now()'), false)
    assert.equal(compiled.params.includes('FR'), true)
    assert.equal(compiled.params.includes(20), true)
  })
})

describe('existingApitubeIdsSql', () => {
  it('when apitube ids are listed, then the statement selects the stored ids', () => {
    const compiled = compileSql(existingApitubeIdsSql(['abc', 'def']))

    assert.match(compiled.sql, /SELECT apitube_id FROM articles WHERE apitube_id IN/)
    assert.equal(compiled.params.includes('abc'), true)
    assert.equal(compiled.params.includes('def'), true)
  })

  it('when the id list is empty, then listExistingApitubeIds does not query', async () => {
    const repository = new DbArticleRepository('postgres://local/test')
    const ids = await repository.listExistingApitubeIds([])
    assert.deepEqual(ids, [])
  })
})

describe('purgeArticlesSql', () => {
  it('when published_at is older than the retention window, then the purge deletes that row', () => {
    const compiled = compileSql(purgeArticlesSql(14))

    assert.match(compiled.sql, /DELETE FROM articles/)
    assert.match(compiled.sql, /published_at < now\(\) - make_interval/)
    assert.equal(compiled.params.includes(14), true)
  })

  it('when the sealed spatial query is compiled, then it does not contain now()', () => {
    const compiled = compileSql(
      spatialNewsSql({
        west: 170,
        south: -10,
        east: -170,
        north: 10,
        categoryId: null,
        limit: 200,
      }),
    )

    assert.equal(compiled.sql.includes('now()'), false)
  })
})
