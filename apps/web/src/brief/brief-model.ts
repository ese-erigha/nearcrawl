import { regionName, type Article } from '../articles/article.ts'
import { CATEGORY, CATEGORY_LABEL, TOPIC } from '../articles/topics.ts'

export const BRIEF_WINDOW_HOURS = 48
export const BRIEF_WINDOW_MS = BRIEF_WINDOW_HOURS * 3_600_000

const TOPIC_ROWS = [
  { id: TOPIC.POLITICS, label: CATEGORY_LABEL[CATEGORY.POLITICS] },
  { id: TOPIC.FINANCE, label: CATEGORY_LABEL[CATEGORY.FINANCE] },
  { id: TOPIC.DISASTER, label: CATEGORY_LABEL[CATEGORY.DISASTER] },
] as const

const POST_LIMIT = 280

export type BriefItem = {
  number: number
  story: Article
  host: string
}

export type BriefGroupView = {
  id: string
  label: string
  items: BriefItem[]
}

export type BriefTopicCount = {
  label: string
  count: number
}

export type SavedPreferences = {
  homeCountryCodes: readonly string[]
  categoryIds: readonly number[]
  trackedNames: readonly string[]
}

export type BriefStory = {
  countryCodes: string[]
  categoryId: number
  title: string
  description: string | null
  body: string
}

export type BriefView = {
  headline: string
  byline: string
  morningNote: string
  dayLabel: string
  summary: string
  storyCount: number
  countryCount: number
  breakingCount: number
  alsoHotCount: number
  sourceCount: number
  shareTotal: number
  topicCounts: BriefTopicCount[]
  groups: BriefGroupView[]
  thread: string[]
  shareTitle: string
  shareText: string
}

export function storiesInBrief<T extends { publishedAt: string }>(stories: T[], now = Date.now()): T[] {
  return stories.filter((story) => now - Date.parse(story.publishedAt) <= BRIEF_WINDOW_MS)
}

export function sourceHost(url: string): string {
  return new URL(url).host.replace(/^www\./, '')
}

export function storyMatchesPreferences(story: BriefStory, preferences: SavedPreferences): boolean {
  const inCountry = story.countryCodes.some((code) => preferences.homeCountryCodes.includes(code))
  const inTopic = preferences.categoryIds.includes(story.categoryId)
  if (inCountry && inTopic) return true
  const haystack = `${story.title} ${story.description ?? ''} ${story.body}`.toLowerCase()
  return preferences.trackedNames.some((name) => name.trim().length > 0 && haystack.includes(name.trim().toLowerCase()))
}

export function buildCountryBrief(
  stories: Article[],
  placeName: string | null,
  now = Date.now(),
  summary = '',
): BriefView {
  const inWindow = storiesInBrief(stories, now)
  const sourceCount = new Set(inWindow.map((story) => story.sourceName)).size
  const sourceWord = sourceCount === 1 ? 'source' : 'sources'
  const place = placeName ?? 'the world'
  const shareTitle = `What is hot in ${place}, ${shortDate(now)}`
  const byline = `Researched by NearCrawl from ${sourceCount} ${sourceWord}, ${compiledLabel(now)}. Counts are live.`
  return assembleBrief(inWindow, now, {
    headline: placeName ? `What is hot in ${placeName} in the last 48 hours` : 'What is hot in the last 48 hours',
    byline,
    morningNote: placeName
      ? `The ${placeName} brief is this page. Copy the link, or open the same list on the map.`
      : 'This brief is the breaking list. Copy the link, or open the same list on the map.',
    summary,
    shareTitle,
  })
}

export function buildUserBrief(stories: Article[], preferences: SavedPreferences, now = Date.now()): BriefView {
  const matched = storiesInBrief(stories, now).filter((story) => storyMatchesPreferences(story, preferences))
  const countries = preferences.homeCountryCodes.map((code) => regionName(code))
  const topics = TOPIC_ROWS.filter((topic) => preferences.categoryIds.includes(topic.id)).map((topic) => topic.label)
  const names = preferences.trackedNames.filter((name) => name.trim().length > 0)
  const shareTitle = `What is hot for you, ${shortDate(now)}`
  return assembleBrief(matched, now, {
    headline: 'What is hot for you in the last 48 hours',
    byline: `${joinWords(countries)}. ${joinWords(topics)}. Tracking ${joinWords(names)}. ${compiledLabel(now)}.`,
    morningNote: 'This brief follows your saved countries, topics, and names.',
    summary: '',
    shareTitle,
  })
}

function assembleBrief(
  stories: Article[],
  now: number,
  copy: { headline: string; byline: string; morningNote: string; summary: string; shareTitle: string },
): BriefView {
  const breaking = stories.filter((story) => story.isBreaking)
  const alsoHot = stories.filter((story) => !story.isBreaking)
  const groups = [
    group('breaking', 'Breaking', breaking, 1),
    group('also-hot', 'Also hot', alsoHot, breaking.length + 1),
  ].filter((entry) => entry.items.length > 0)
  const items = groups.flatMap((entry) => entry.items)
  const topicCounts = TOPIC_ROWS.map((topic) => ({
    label: topic.label,
    count: stories.filter((story) => story.categoryId === topic.id).length,
  }))
  return {
    headline: copy.headline,
    byline: copy.byline,
    morningNote: copy.morningNote,
    dayLabel: dayLabel(now),
    summary: copy.summary,
    storyCount: stories.length,
    countryCount: new Set(stories.flatMap((story) => story.countryCodes)).size,
    breakingCount: breaking.length,
    alsoHotCount: alsoHot.length,
    sourceCount: new Set(stories.map((story) => story.sourceName)).size,
    shareTotal: stories.reduce((total, story) => total + story.shareCount, 0),
    topicCounts,
    groups,
    thread: briefThread(copy.shareTitle, copy.summary, items),
    shareTitle: copy.shareTitle,
    shareText: copy.summary ? `${copy.shareTitle}. ${copy.summary}` : copy.shareTitle,
  }
}

function joinWords(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`
}

function group(id: string, label: string, stories: Article[], start: number): BriefGroupView {
  return {
    id,
    label,
    items: stories.map((story, index) => ({
      number: start + index,
      story,
      host: sourceHost(story.sourceUrl),
    })),
  }
}

function briefThread(title: string, summary: string, items: BriefItem[]): string[] {
  const posts = items.map((item) => `${item.number}. ${item.story.title}. ${item.story.description ?? ''}`.trim())
  const opening = summary ? `${title}. ${summary}` : title
  return [clip(opening), ...posts.map((post) => clip(post))]
}

function clip(text: string): string {
  if (text.length <= POST_LIMIT) return text
  return `${text.slice(0, POST_LIMIT - 1).trimEnd()}…`
}

function dayLabel(now: number): string {
  const date = new Date(now)
  const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' }).format(date)
  const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: 'UTC' }).format(date)
  const month = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' }).format(date)
  return `${weekday} ${day} ${month}`
}

function shortDate(now: number): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(now))
}

function compiledLabel(now: number): string {
  const date = new Date(now)
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${shortDate(now)} at ${hours}:${minutes} UTC`
}
