import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { runWithConfig, type IngestionConfig } from '../../config.ts'
import { listNewsPage, toNewsItem } from './news.service.ts'

const config: IngestionConfig = {
  databaseUrl: 'postgres://local/test',
  apitubeApiKey: 'test-key',
  retentionDays: 14,
  intervalMinutes: 17,
  maxPages: 100,
  sentryDsn: 'https://local@sentry.test/1',
  sentryEnvironment: 'test',
}

const article = {
  id: 42,
  href: 'https://example.com/story',
  published_at: '2026-10-28T00:00:00.000Z',
  title: 'Headline',
  description: 'Short',
  body: 'Long',
  source: { domain: 'example.com' },
  categories: [
    {
      taxonomy: 'iptc_mediatopics',
      links: { self: 'https://api.apitube.io/v1/news/category/iptc_mediatopics/medtop:20000350' },
    },
  ],
  keywords: ['bank'],
  is_breaking: true,
  story: { id: 42 },
  locations_mentioned: [{ lat: null, lng: null }, { name: 'Headline', lat: 1.3, lng: 103.8 }],
}

describe('toNewsItem', () => {
  it('when the article has a medtop link, then the item keeps that id and the description', () => {
    const item = toNewsItem(article)
    assert.equal(item?.apitubeId, '42')
    assert.equal(item?.description, 'Short')
    assert.equal(item?.sourceName, 'example.com')
    assert.deepEqual(item?.medtopIds, ['medtop:20000350'])
    assert.deepEqual(item?.tags, ['bank'])
    assert.equal(item?.latitude, 1.3)
    assert.equal(item?.longitude, 103.8)
    assert.equal(item?.isBreaking, true)
    assert.equal(item?.storyId, '42')
  })

  it('when the category object has a name, then the topic keeps that name and no parent', () => {
    const item = toNewsItem({
      ...article,
      categories: [
        {
          name: 'central bank',
          taxonomy: 'iptc_mediatopics',
          links: { self: 'https://api.apitube.io/v1/news/category/iptc_mediatopics/medtop:20000350' },
        },
      ],
    })
    assert.equal(item?.topics[0]?.name, 'central bank')
    assert.equal(item?.topics[0]?.parentMedtopId, null)
    assert.deepEqual(item?.medtopIds, ['medtop:20000350'])
  })

  it('when the article has no coordinates, then the item is left out', () => {
    const item = toNewsItem({ ...article, locations_mentioned: [{ lat: null, lng: null }] })
    assert.equal(item, null)
  })

  it('when the place name is past the opening, then the item is left out', () => {
    const item = toNewsItem({
      ...article,
      title: 'Anime news',
      description: 'A short lead',
      body: `${'x'.repeat(2000)} Jasper`,
      locations_mentioned: [{ name: 'Jasper', lat: 52.7, lng: -118.3 }],
    })
    assert.equal(item, null)
  })

  it('when a later place is named in the title, then that place supplies the pin', () => {
    const item = toNewsItem({
      ...article,
      title: 'Game in Edmonton',
      locations_mentioned: [
        { name: 'Jasper', lat: 52.7, lng: -118.3 },
        { name: 'Edmonton', lat: 53.5, lng: -113.5 },
      ],
    })
    assert.equal(item?.latitude, 53.5)
    assert.equal(item?.longitude, -113.5)
  })

  it('when description is absent and summary has sentences, then the stored description is null', () => {
    const item = toNewsItem({
      ...article,
      description: undefined,
      summary: [{ sentence: 'A key sentence' }],
    })
    assert.equal(item?.description, null)
  })

  it('when body is absent and description is present, then body stores that description', () => {
    const item = toNewsItem({ ...article, body: undefined })
    assert.equal(item?.body, 'Short')
  })

  it('when two places use FR, then one country code is stored', () => {
    const item = toNewsItem({
      ...article,
      locations_mentioned: [
        { name: 'Headline', country: 'FR', lat: 48.8, lng: 2.3 },
        { country: 'fr', lat: 45.7, lng: 4.8 },
      ],
    })
    assert.deepEqual(item?.countryCodes, ['FR'])
  })

  it('when places use FR and US, then both country codes are stored', () => {
    const item = toNewsItem({
      ...article,
      locations_mentioned: [
        { name: 'Headline', country: 'FR', lat: 48.8, lng: 2.3 },
        { country: 'US', lat: 40.7, lng: -74 },
      ],
    })
    assert.deepEqual(item?.countryCodes, ['FR', 'US'])
  })

  it('when the publisher country is us, then source country is US and the story countries stay unchanged', () => {
    const item = toNewsItem({
      ...article,
      source: { domain: 'example.com', location: { country_code: 'us', country_name: 'United States' } },
      locations_mentioned: [{ name: 'Headline', country: 'FR', lat: 48.8, lng: 2.3 }],
    })
    assert.equal(item?.sourceCountryCode, 'US')
    assert.deepEqual(item?.countryCodes, ['FR'])
  })
})

describe('listNewsPage', () => {
  it('when the client requests a page, then the key stays in the header', async (t) => {
    const original = globalThis.fetch
    t.after(() => {
      globalThis.fetch = original
    })
    let href = ''
    let apiKey: string | null = null
    globalThis.fetch = async (input, init) => {
      href = String(input)
      apiKey = new Headers(init?.headers).get('X-API-Key')
      return Response.json({ results: [], has_next_pages: false })
    }
    const page = await runWithConfig(config, () => listNewsPage(1))
    assert.equal(page.items.length, 0)
    assert.equal(href.includes('api_key'), false)
    assert.equal(href.includes('page=1'), true)
    assert.equal(href.includes('sort.order=desc'), true)
    assert.equal(apiKey, 'test-key')
  })

  it('when the client requests a page, then the search is limited to English', async (t) => {
    const original = globalThis.fetch
    t.after(() => {
      globalThis.fetch = original
    })
    let href = ''
    globalThis.fetch = async (input) => {
      href = String(input)
      return Response.json({ results: [], has_next_pages: false })
    }
    await runWithConfig(config, () => listNewsPage(1))
    assert.equal(new URL(href).searchParams.get('language.code'), 'en')
  })

  it('when APITube responds with an error status, then the client throws', async (t) => {
    const original = globalThis.fetch
    t.after(() => {
      globalThis.fetch = original
    })
    globalThis.fetch = async () => new Response('no', { status: 401 })
    await assert.rejects(() => runWithConfig(config, () => listNewsPage(1)), /APITube responded 401: no/)
  })

})
