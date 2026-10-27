import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

import { CATEGORY, categoryCatalog } from './categories.catalog.ts'

describe('category catalog', () => {
  it('when the catalog is loaded, then it covers every APITube topic plus general', () => {
    assert.equal(categoryCatalog.length, 1086)
    const ids = new Set(categoryCatalog.map((row) => row.id))
    assert.equal(ids.size, categoryCatalog.length)
    for (const row of categoryCatalog) {
      if (row.parentId !== null) {
        assert.equal(ids.has(row.parentId), true)
        assert.equal(row.parentId < row.id, true)
      }
    }
  })

  it('when the migration is read, then it seeds the same rows as the catalog', () => {
    const sql = readFileSync(
      new URL('../../../infra/migrations/0001_news_categories.sql', import.meta.url),
      'utf8',
    )
    const centralBank = categoryCatalog.find((row) => row.medtopId === 'medtop:20000350')
    assert.ok(centralBank)
    assert.match(sql, new RegExp(`\\(${CATEGORY.FINANCE}, 'Finance', NULL, 'medtop:04000000'\\)`))
    assert.match(sql, new RegExp(`\\(${CATEGORY.GENERAL}, 'General', NULL, NULL\\)`))
    assert.match(
      sql,
      new RegExp(`\\(${centralBank.id}, 'central bank', ${centralBank.parentId}, 'medtop:20000350'\\)`),
    )
    assert.match(sql, /setval\(pg_get_serial_sequence\('categories', 'id'\)/)
    assert.equal(sql.includes(`WHEN 'Geopolitics' THEN ${CATEGORY.POLITICS}`), true)
  })
})
