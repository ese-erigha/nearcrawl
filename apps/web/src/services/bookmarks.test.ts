import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createBookmark } from './bookmarks.ts'

describe('createBookmark', () => {
  it('stamps an id and a save time onto the article snapshot', () => {
    const savedAt = new Date('2026-10-26T12:00:00.000Z')
    const bookmark = createBookmark(
      {
        title: 'Port closure',
        summary: 'Shipping halted overnight.',
        sourceUrl: 'https://example.com/port',
        coordinates: { latitude: 1.3, longitude: 103.8 },
        tags: ['Geopolitics'],
      },
      savedAt,
    )

    assert.equal(bookmark.savedAt, '2026-10-26T12:00:00.000Z')
    assert.equal(bookmark.title, 'Port closure')
    assert.equal(bookmark.coordinates.latitude, 1.3)
    assert.match(bookmark.id, /^[0-9a-f-]{36}$/i)
  })
})
