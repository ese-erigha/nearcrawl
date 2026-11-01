import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { compileSql } from './articles.sql.ts'
import { insertCategorySql } from './categories.sql.ts'

describe('insertCategorySql', () => {
  it('when a medtop id is new, then the statement inserts it and returns the row on conflict', () => {
    const compiled = compileSql(
      insertCategorySql({ name: 'digital currency', parentId: 204, medtopId: 'medtop:20009999' }),
    )

    assert.match(compiled.sql, /INSERT INTO categories/)
    assert.match(compiled.sql, /ON CONFLICT \(medtop_id\) DO UPDATE/)
    assert.match(compiled.sql, /RETURNING id, parent_id, medtop_id/)
    assert.equal(compiled.params.includes('digital currency'), true)
    assert.equal(compiled.params.includes(204), true)
    assert.equal(compiled.params.includes('medtop:20009999'), true)
  })
})
