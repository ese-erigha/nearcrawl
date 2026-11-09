import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { CATEGORY, TOPIC } from '../fixtures/home.fixture.ts'
import { FEED_WINDOW, categoryCounts, storiesInWindow, storyBars } from './hot-window.ts'

const NOW = Date.parse('2026-11-08T12:00:00.000Z')

function atHoursAgo(hours: number): { publishedAt: string } {
  return { publishedAt: new Date(NOW - hours * 3_600_000).toISOString() }
}

describe('storiesInWindow', () => {
  it('when the window is 24 hours, then a story from two days ago stays out', () => {
    const stories = storiesInWindow([atHoursAgo(2), atHoursAgo(48)], FEED_WINDOW.DAY, NOW)
    assert.equal(stories.length, 1)
  })

  it('when the window is 14 days, then a story from two days ago stays in', () => {
    const stories = storiesInWindow([atHoursAgo(48)], FEED_WINDOW.FEED, NOW)
    assert.equal(stories.length, 1)
  })
})

describe('storyBars', () => {
  it('when a story is new, then it sits in the last bar', () => {
    const bars = storyBars([atHoursAgo(1)], FEED_WINDOW.FEED, NOW)
    assert.equal(bars.at(-1), 1)
    assert.equal(bars[0], 0)
  })

  it('when a day has no stories, then that bar stays empty', () => {
    const bars = storyBars([atHoursAgo(1)], FEED_WINDOW.WEEK, NOW)
    assert.equal(bars.filter((count) => count === 0).length, 6)
  })
})

describe('categoryCounts', () => {
  it('when the list mixes topics, then each topic count matches its rows', () => {
    const counts = categoryCounts([
      { categoryId: TOPIC.POLITICS },
      { categoryId: TOPIC.POLITICS },
      { categoryId: TOPIC.FINANCE },
      { categoryId: TOPIC.DISASTER },
    ])
    assert.equal(counts[CATEGORY.ALL], 4)
    assert.equal(counts[CATEGORY.POLITICS], 2)
    assert.equal(counts[CATEGORY.FINANCE], 1)
    assert.equal(counts[CATEGORY.DISASTER], 1)
  })
})
