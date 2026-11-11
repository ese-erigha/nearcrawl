import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { Article } from '../articles/article.ts'
import { TOPIC } from '../articles/topics.ts'
import { buildCountryBrief, buildUserBrief, storiesInBrief, storyMatchesPreferences } from './brief-model.ts'

const NOW = Date.parse('2026-11-08T12:00:00.000Z')

function story(id: string, overrides: Partial<Article> = {}): Article {
  return {
    id,
    title: id,
    description: `${id} line.`,
    body: `${id} body.`,
    bodyHtml: null,
    imageUrl: null,
    faviconUrl: null,
    authorName: null,
    sourceName: 'Desk',
    sourceUrl: 'https://example.com/story',
    sourceHomeUrl: null,
    sourceCountryName: null,
    sourceCountryCode: null,
    latitude: 0,
    longitude: 0,
    categoryId: TOPIC.FINANCE,
    categories: [{ id: TOPIC.FINANCE, name: 'Finance' }],
    countryCodes: ['US'],
    tags: [],
    publishedAt: new Date(NOW - 2 * 3_600_000).toISOString(),
    isBreaking: false,
    readTimeMinutes: null,
    wordsCount: null,
    isFree: null,
    shareCount: 1,
    sourceRank: null,
    storyId: null,
    ...overrides,
  }
}

describe('storiesInBrief', () => {
  it('when a story is older than 48 hours, then the brief window leaves it out', () => {
    const stories = storiesInBrief(
      [{ publishedAt: new Date(NOW - 49 * 3_600_000).toISOString() }, { publishedAt: new Date(NOW - 2 * 3_600_000).toISOString() }],
      NOW,
    )
    assert.equal(stories.length, 1)
  })
})

describe('buildCountryBrief', () => {
  it('when the brief loads, then breaking stories come before also hot', () => {
    const brief = buildCountryBrief(
      [story('later', { isBreaking: false }), story('first', { isBreaking: true })],
      'Japan',
      NOW,
    )
    const labels = brief.groups.map((group) => group.label)
    assert.deepEqual(labels, ['Breaking', 'Also hot'])
    assert.ok(brief.groups[0]?.items.every((item) => item.story.isBreaking))
    assert.ok(brief.groups[1]?.items.every((item) => !item.story.isBreaking))
  })

  it('when the country brief builds, then the byline names NearCrawl and the live counts', () => {
    const brief = buildCountryBrief([story('first')], 'Canada', NOW)
    assert.equal(
      brief.byline,
      'Researched by NearCrawl from 1 source, 8 Nov 2026 at 12:00 UTC. Counts are live.',
    )
  })

  it('when the country brief receives a model summary, then the page keeps that paragraph', () => {
    const brief = buildCountryBrief([story('first')], 'Canada', NOW, 'Ports closed overnight.')
    assert.equal(brief.summary, 'Ports closed overnight.')
    assert.equal(brief.shareText, 'What is hot in Canada, 8 Nov 2026. Ports closed overnight.')
  })

  it('when the brief numbers the list, then also hot continues the count', () => {
    const brief = buildCountryBrief(
      [story('first', { isBreaking: true }), story('later', { isBreaking: false })],
      'Japan',
      NOW,
    )
    const firstAlsoHot = brief.groups[1]?.items[0]
    assert.equal(firstAlsoHot?.number, (brief.groups[0]?.items.length ?? 0) + 1)
  })
})

describe('storyMatchesPreferences', () => {
  const preferences = {
    homeCountryCodes: ['US'],
    categoryIds: [TOPIC.FINANCE],
    trackedNames: ['Osaka'],
  }
  const matched = {
    countryCodes: ['US'],
    categoryId: TOPIC.FINANCE,
    title: 'Ports slow',
    description: 'Containers sit.',
    body: 'Night gates stay shut.',
  }

  it('when a story matches a saved country and topic, then it stays in the user brief', () => {
    assert.equal(storyMatchesPreferences(matched, preferences), true)
  })

  it('when a home-country story is outside the saved topics, then it stays out', () => {
    assert.equal(storyMatchesPreferences({ ...matched, categoryId: TOPIC.POLITICS }, preferences), false)
  })

  it('when a tracked name matches a story outside the saved countries, then it stays in', () => {
    assert.equal(
      storyMatchesPreferences(
        { ...matched, countryCodes: ['JP'], categoryId: TOPIC.POLITICS, title: 'Osaka crowd record falls' },
        preferences,
      ),
      true,
    )
  })
})

describe('buildUserBrief', () => {
  const preferences = {
    homeCountryCodes: ['US'],
    categoryIds: [TOPIC.FINANCE],
    trackedNames: ['Osaka'],
  }

  it('when a saved-country story is in the list, then the brief keeps it and drops an unmatched storm', () => {
    const brief = buildUserBrief(
      [
        story('ports', { isBreaking: true }),
        story('osaka', { countryCodes: ['JP'], categoryId: TOPIC.POLITICS, title: 'Osaka crowd record falls', isBreaking: false }),
        story('storm', { countryCodes: ['JP'], categoryId: TOPIC.DISASTER, title: 'Typhoon watch', isBreaking: true }),
      ],
      preferences,
      NOW,
    )
    const ids = brief.groups.flatMap((group) => group.items.map((item) => item.story.id))
    assert.equal(ids.includes('ports'), true)
    assert.equal(ids.includes('osaka'), true)
    assert.equal(ids.includes('storm'), false)
  })
})
