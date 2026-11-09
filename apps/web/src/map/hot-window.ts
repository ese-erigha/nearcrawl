import { CATEGORY, TOPIC, type Category } from '../fixtures/home.fixture.ts'

export const FEED_WINDOW = {
  DAY: '24h',
  WEEK: '7d',
  FEED: '14d',
} as const

export type FeedWindow = (typeof FEED_WINDOW)[keyof typeof FEED_WINDOW]

export const FEED_WINDOW_LABEL: Record<FeedWindow, string> = {
  [FEED_WINDOW.DAY]: '24h',
  [FEED_WINDOW.WEEK]: '7d',
  [FEED_WINDOW.FEED]: '14d',
}

export const FEED_WINDOW_HEADING: Record<FeedWindow, string> = {
  [FEED_WINDOW.DAY]: 'Last 24 hours',
  [FEED_WINDOW.WEEK]: 'Last 7 days',
  [FEED_WINDOW.FEED]: 'Last 14 days',
}

const HOUR_MS = 3_600_000

const WINDOW_MS: Record<FeedWindow, number> = {
  [FEED_WINDOW.DAY]: 24 * HOUR_MS,
  [FEED_WINDOW.WEEK]: 7 * 24 * HOUR_MS,
  [FEED_WINDOW.FEED]: 14 * 24 * HOUR_MS,
}

const BAR_COUNT: Record<FeedWindow, number> = {
  [FEED_WINDOW.DAY]: 8,
  [FEED_WINDOW.WEEK]: 7,
  [FEED_WINDOW.FEED]: 14,
}

type TimedStory = { publishedAt: string }

type FiledStory = { categoryId: number }

export function storiesInWindow<T extends TimedStory>(stories: T[], window: FeedWindow, now = Date.now()): T[] {
  const span = WINDOW_MS[window]
  return stories.filter((story) => {
    const age = now - Date.parse(story.publishedAt)
    return age >= 0 && age <= span
  })
}

export function storyBars(stories: TimedStory[], window: FeedWindow, now = Date.now()): number[] {
  const span = WINDOW_MS[window]
  const bars = BAR_COUNT[window]
  const bucket = span / bars
  const counts = Array.from({ length: bars }, () => 0)
  for (const story of stories) {
    const age = now - Date.parse(story.publishedAt)
    if (age < 0 || age > span) continue
    const index = Math.min(bars - 1, Math.floor((span - age) / bucket))
    counts[index] += 1
  }
  return counts
}

export function matchesCategory(story: FiledStory, category: Category): boolean {
  if (category === CATEGORY.ALL) return true
  if (category === CATEGORY.POLITICS) return story.categoryId === TOPIC.POLITICS
  if (category === CATEGORY.FINANCE) return story.categoryId === TOPIC.FINANCE
  return story.categoryId === TOPIC.DISASTER
}

export function categoryCounts(stories: FiledStory[]): Record<Category, number> {
  return {
    [CATEGORY.ALL]: stories.length,
    [CATEGORY.POLITICS]: stories.filter((story) => story.categoryId === TOPIC.POLITICS).length,
    [CATEGORY.FINANCE]: stories.filter((story) => story.categoryId === TOPIC.FINANCE).length,
    [CATEGORY.DISASTER]: stories.filter((story) => story.categoryId === TOPIC.DISASTER).length,
  }
}
