import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { CATEGORY, categoryCatalog } from 'db'

import app from './app.ts'
import type { ArticlePin } from './domain/articles/articles.mappers.ts'

describe('gateway routes', () => {
  it('reports health without opening a database', async () => {
    const response = await app.request('/health')
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { status: 'ok' })
  })

  it('returns the fixture pin for a box that contains it', async () => {
    const response = await app.request('/api/spatial/news?bbox=103,1,104,2')
    assert.equal(response.status, 200)
    const body = (await response.json()) as { truncated: boolean; articles: ArticlePin[] }
    assert.equal(body.truncated, false)
    assert.equal(body.articles[0]?.sourceName, 'Harbor Desk')
    assert.equal(body.articles[0]?.categoryId, CATEGORY.POLITICS)
    assert.deepEqual(body.articles[0]?.categories, [{ id: CATEGORY.POLITICS, name: 'Politics' }])
  })

  it('rejects an unknown category id', async () => {
    const response = await app.request('/api/spatial/news?bbox=103,1,104,2&categoryId=999999')
    assert.equal(response.status, 400)
  })

  it('lists the menu and a topic with its children', async () => {
    const menu = await app.request('/api/categories')
    assert.equal(menu.status, 200)
    const menuBody = (await menu.json()) as { categories: { id: number; childCount: number }[] }
    assert.equal(menuBody.categories[0]?.id, CATEGORY.POLITICS)
    assert.equal(menuBody.categories.at(-1)?.id, CATEGORY.GENERAL)

    const music = categoryCatalog.find((row) => row.medtopId === 'medtop:20000018')
    const musicalGenre = categoryCatalog.find((row) => row.medtopId === 'medtop:20000021')
    assert.ok(music)
    assert.ok(musicalGenre)
    const topic = await app.request(`/api/categories/${music.id}`)
    assert.equal(topic.status, 200)
    const topicBody = (await topic.json()) as {
      parent: { id: number } | null
      children: { id: number }[]
    }
    assert.equal(topicBody.parent?.id, music.parentId)
    assert.equal(topicBody.children.some((child) => child.id === musicalGenre.id), true)
  })

  it('returns category not found for an unknown topic', async () => {
    const missing = await app.request('/api/categories/999999')
    assert.equal(missing.status, 404)
    assert.deepEqual(await missing.json(), { error: 'Category not found' })

    const text = await app.request('/api/categories/not-a-topic')
    assert.equal(text.status, 400)
  })

  it('returns the fixture from the politics article list', async () => {
    const response = await app.request(`/api/categories/${CATEGORY.POLITICS}/articles`)
    assert.equal(response.status, 200)
    const body = (await response.json()) as { articles: ArticlePin[] }
    assert.equal(body.articles[0]?.categoryId, CATEGORY.POLITICS)
  })

  it('returns validation details when bbox is missing', async () => {
    const response = await app.request('/api/spatial/news')
    assert.equal(response.status, 400)
    const body = (await response.json()) as { error: string; details: unknown }
    assert.equal(body.error, 'Validation failed')
    assert.ok(Array.isArray(body.details))
  })

  it('returns article not found for an unknown id', async () => {
    const response = await app.request('/api/articles/00000000-0000-4000-8000-000000000000')
    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), { error: 'Article not found' })
  })

  it('returns 503 when the live query sealer env vars are unset', async () => {
    const response = await app.request('/api/spatial/news/live', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ bbox: [-10, -20, 10, 30] }),
    })
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { error: 'Live query sealer is not configured' })
  })
})
