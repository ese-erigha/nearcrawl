import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { CATEGORY, TOPIC, VISITOR_COUNTRY_CODE, listBriefGroups, listCountryStories, listGlobalBreaking } from './home.fixture.ts'

describe('home fixtures', () => {
  it('when the visitor has no account, then the country list is Japan only', () => {
    const stories = listCountryStories(CATEGORY.ALL, '')
    assert.ok(stories.every((story) => story.countryCodes.includes(VISITOR_COUNTRY_CODE)))
    assert.ok(stories.length > 0)
  })

  it('when the category is finance, then the country list drops other topics', () => {
    const stories = listCountryStories(CATEGORY.FINANCE, '')
    assert.ok(stories.every((story) => story.categoryId === TOPIC.FINANCE))
  })

  it('when the brief groups load, then breaking stories come before the rest', () => {
    const groups = listBriefGroups()
    assert.equal(groups[0]?.label, 'Breaking')
    assert.ok(groups[0]?.stories.every((story) => story.isBreaking))
    assert.equal(groups[1]?.label, 'Also hot')
    assert.ok(groups[1]?.stories.every((story) => !story.isBreaking))
  })

  it('when a fixture article loads, then it has the gateway article fields', () => {
    const story = listCountryStories(CATEGORY.ALL, '')[0]
    assert.ok(story)
    assert.equal(typeof story.body, 'string')
    assert.equal(typeof story.publishedAt, 'string')
    assert.equal(typeof story.categoryId, 'number')
    assert.equal(story.storyId, null)
    assert.ok(story.countryCodes.length > 0)
  })

  it('when the dock loads, then every card is a breaking story', () => {
    const stories = listGlobalBreaking()
    assert.ok(stories.every((story) => story.isBreaking))
    assert.ok(stories.some((story) => !story.countryCodes.includes(VISITOR_COUNTRY_CODE)))
  })
})
