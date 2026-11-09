import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildBrief, buildUserBrief, storiesInBrief, storyMatchesPreferences } from './brief-model.ts'
import { TOPIC } from '../fixtures/home.fixture.ts'

const NOW = Date.parse('2026-11-08T12:00:00.000Z')

describe('storiesInBrief', () => {
  it('when a story is older than 48 hours, then the brief window leaves it out', () => {
    const stories = storiesInBrief(
      [{ publishedAt: new Date(NOW - 49 * 3_600_000).toISOString() }, { publishedAt: new Date(NOW - 2 * 3_600_000).toISOString() }],
      NOW,
    )
    assert.equal(stories.length, 1)
  })
})

describe('buildBrief', () => {
  it('when the brief loads, then breaking stories come before also hot', () => {
    const brief = buildBrief(NOW)
    const labels = brief.groups.map((group) => group.label)
    assert.deepEqual(labels, ['Breaking', 'Also hot'])
    assert.ok(brief.groups[0]?.items.every((item) => item.story.isBreaking))
    assert.ok(brief.groups[1]?.items.every((item) => !item.story.isBreaking))
  })

  it('when the brief numbers the list, then also hot continues the count', () => {
    const brief = buildBrief(NOW)
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
  const story = {
    countryCodes: ['US'],
    categoryId: TOPIC.FINANCE,
    title: 'Ports slow',
    description: 'Containers sit.',
    body: 'Night gates stay shut.',
  }

  it('when a story matches a saved country and topic, then it stays in the user brief', () => {
    assert.equal(storyMatchesPreferences(story, preferences), true)
  })

  it('when a home-country story is outside the saved topics, then it stays out', () => {
    assert.equal(storyMatchesPreferences({ ...story, categoryId: TOPIC.POLITICS }, preferences), false)
  })

  it('when a tracked name matches a story outside the saved countries, then it stays in', () => {
    assert.equal(
      storyMatchesPreferences(
        { ...story, countryCodes: ['JP'], categoryId: TOPIC.POLITICS, title: 'Osaka crowd record falls' },
        preferences,
      ),
      true,
    )
  })
})

describe('buildUserBrief', () => {
  it('when the user brief loads, then a saved-country story stays in and the device-country storm stays out', () => {
    const ids = buildUserBrief(undefined, NOW).groups.flatMap((group) => group.items.map((item) => item.story.id))
    assert.ok(ids.includes('us-ports'))
    assert.ok(ids.includes('osaka-expo'))
    assert.equal(ids.includes('kyushu-typhoon'), false)
  })
})

