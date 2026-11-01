import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { compileSql, purgeArticlesSql, spatialNewsSql, upsertArticlesSql, type UpsertArticle } from './articles.sql.ts'

const article: UpsertArticle = {
  apitubeId: 'abc',
  title: 'Headline',
  summary: 'Short',
  body: 'Long',
  sourceName: 'example.com',
  sourceUrl: 'https://example.com/a',
  latitude: 1.3,
  longitude: 103.8,
  categoryId: 6,
  categoryIds: [204, 49, 6],
  tags: [],
  publishedAt: new Date('2026-10-28T00:00:00.000Z'),
  isBreaking: false,
  storyId: null,
}

describe('upsertArticlesSql', () => {
  it('when the same apitube id is written again, then the statement updates that row and replaces the join rows', () => {
    const first = compileSql(upsertArticlesSql([article]))
    const second = compileSql(upsertArticlesSql([{ ...article, categoryId: 1, categoryIds: [1] }]))

    assert.match(first.sql, /ON CONFLICT \(apitube_id\) DO UPDATE/)
    assert.match(first.sql, /NOT EXISTS/)
    assert.match(first.sql, /ON CONFLICT \(article_id, category_id\) DO NOTHING/)
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
        { ...article, apitubeId: 'def', categoryId: 1, categoryIds: [1] },
      ]),
    )

    assert.equal(compiled.params.includes('abc'), true)
    assert.equal(compiled.params.includes('def'), true)
    assert.equal(compiled.sql.includes('ingested_at'), false)
    assert.equal(compiled.sql.includes('now()'), false)
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
