import {
  ARTICLES,
  CATEGORY,
  CATEGORY_LABEL,
  SAVED_PREFERENCES,
  TOPIC,
  VISITOR_COUNTRY,
  articleCountry,
  listCountryStories,
  type Article,
} from '../fixtures/home.fixture.ts'

export const BRIEF_WINDOW_MS = 48 * 3_600_000

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
  lead: string
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

export function buildBrief(now = Date.now()): BriefView {
  const stories = storiesInBrief(listCountryStories(CATEGORY.ALL, ''), now)
  const sourceWord = stories.length === 1 ? 'source' : 'sources'
  const shareTitle = `What is hot in ${VISITOR_COUNTRY}, ${shortDate(now)}`
  return assembleBrief(stories, now, {
    headline: `What is hot in ${VISITOR_COUNTRY} in the last 48 hours`,
    byline: `From ${new Set(stories.map((story) => story.sourceName)).size} ${sourceWord} in ${VISITOR_COUNTRY}, ${compiledLabel(now)}.`,
    morningNote: `The ${VISITOR_COUNTRY} brief is this page. Copy the link, or open the same list on the map.`,
    leadPlace: VISITOR_COUNTRY,
    shareTitle,
  })
}

export function buildUserBrief(preferences: SavedPreferences = SAVED_PREFERENCES, now = Date.now()): BriefView {
  const stories = storiesInBrief(ARTICLES, now).filter((story) => storyMatchesPreferences(story, preferences))
  const countries = preferences.homeCountryCodes.map((code) => countryName(code))
  const topics = TOPIC_ROWS.filter((topic) => preferences.categoryIds.includes(topic.id)).map((topic) => topic.label)
  const names = preferences.trackedNames.filter((name) => name.trim().length > 0)
  const shareTitle = `What is hot for you, ${shortDate(now)}`
  return assembleBrief(stories, now, {
    headline: 'What is hot for you in the last 48 hours',
    byline: `${joinWords(countries)}. ${joinWords(topics)}. Tracking ${joinWords(names)}. ${compiledLabel(now)}.`,
    morningNote: 'This brief follows your saved countries, topics, and names.',
    leadPlace: 'your list',
    shareTitle,
  })
}

function assembleBrief(
  stories: Article[],
  now: number,
  copy: { headline: string; byline: string; morningNote: string; leadPlace: string; shareTitle: string },
): BriefView {
  const breaking = stories.filter((story) => story.isBreaking)
  const alsoHot = stories.filter((story) => !story.isBreaking)
  const groups = [
    group('breaking', 'Breaking', breaking, 1),
    group('also-hot', 'Also hot', alsoHot, breaking.length + 1),
  ].filter((entry) => entry.items.length > 0)
  const items = groups.flatMap((entry) => entry.items)
  const lead = briefLead(copy.leadPlace, [...breaking, ...alsoHot])
  return {
    headline: copy.headline,
    byline: copy.byline,
    morningNote: copy.morningNote,
    dayLabel: dayLabel(now),
    lead,
    storyCount: stories.length,
    countryCount: new Set(stories.flatMap((story) => story.countryCodes)).size,
    breakingCount: breaking.length,
    alsoHotCount: alsoHot.length,
    sourceCount: new Set(stories.map((story) => story.sourceName)).size,
    shareTotal: stories.reduce((total, story) => total + story.shareCount, 0),
    topicCounts: TOPIC_ROWS.map((topic) => ({
      label: topic.label,
      count: stories.filter((story) => story.categoryId === topic.id).length,
    })),
    groups,
    thread: briefThread(copy.shareTitle, lead, items),
    shareTitle: copy.shareTitle,
    shareText: `${copy.shareTitle}. ${lead}`,
  }
}

function countryName(code: string): string {
  const story = ARTICLES.find((item) => item.countryCodes.includes(code))
  return story ? articleCountry(story) : code
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

function briefLead(place: string, stories: Article[]): string {
  const lines = stories
    .map((story) => story.description?.trim() ?? '')
    .filter((line) => line.length > 0)
    .slice(0, 3)
  const count = stories.length === 1 ? 'one story' : `${stories.length} stories`
  const head =
    place === 'your list'
      ? `The last 48 hours for you turn on ${count}.`
      : `The last 48 hours in ${place} turn on ${count}.`
  if (lines.length === 0) return head
  return `${head} ${lines.join(' ')}`
}

function briefThread(title: string, lead: string, items: BriefItem[]): string[] {
  const posts = items.map((item) => `${item.number}. ${item.story.title}. ${item.story.description ?? ''}`.trim())
  return [clip(`${title}. ${lead}`), ...posts.map((post) => clip(post))]
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
