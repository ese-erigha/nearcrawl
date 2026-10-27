import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { CATEGORY, compileSql, spatialNewsSql } from 'db'

describe('spatialNewsSql', () => {
  it('binds the box and omits now()', () => {
    const compiled = compileSql(
      spatialNewsSql({
        west: 170,
        south: -10,
        east: -170,
        north: 10,
        categoryId: CATEGORY.FINANCE,
        limit: 200,
      }),
    )

    assert.match(compiled.sql, /longitude >=/)
    assert.match(compiled.sql, /article_categories/)
    assert.match(compiled.sql, /LIMIT/)
    assert.equal(compiled.sql.includes('now()'), false)
    assert.equal(compiled.params.includes(170), true)
    assert.equal(compiled.params.includes(CATEGORY.FINANCE), true)
    assert.equal(compiled.params.includes(200), true)
  })
})
