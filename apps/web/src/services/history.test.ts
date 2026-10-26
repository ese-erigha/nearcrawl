import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createHistoryEntry } from './history.ts'

describe('createHistoryEntry', () => {
  it('records when an article was opened', () => {
    const openedAt = new Date('2026-10-26T15:04:00.000Z')
    const entry = createHistoryEntry(
      { articleId: 'article-1', title: 'Port closure' },
      openedAt,
    )

    assert.equal(entry.articleId, 'article-1')
    assert.equal(entry.openedAt, '2026-10-26T15:04:00.000Z')
    assert.match(entry.id, /^[0-9a-f-]{36}$/i)
  })
})
