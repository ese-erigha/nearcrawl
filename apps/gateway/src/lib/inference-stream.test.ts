import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'

import type { GatewayBindings } from '../config.ts'

const ARTICLE_ID = '00000000-0000-4000-8000-000000000001'
const calls: { url: string; init: RequestInit | undefined }[] = []

let upstreamStatus = 200
let upstreamType = 'text/event-stream'
let upstreamBody = 'event: token\ndata: {"text":"Hi"}\n\n'
let rejectFetch = false

mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => {
  calls.push({ url: String(input), init })
  if (rejectFetch) {
    throw new Error('connect failed')
  }
  return new Response(upstreamBody, {
    status: upstreamStatus,
    headers: { 'content-type': upstreamType },
  })
})

const { default: app } = await import('../app.ts')

const testEnv: GatewayBindings = {
  DATABASE_URL: 'postgres://local/test',
  NEON_REALTIME_URL: 'https://local.test',
  NEON_REALTIME_SECRET: 'local-secret',
  SENTRY_DSN: 'https://local@sentry.test/1',
  SENTRY_ENVIRONMENT: 'test',
  INFERENCE_URL: 'http://127.0.0.1:8000',
  INFERENCE_SECRET: 'local-inference-secret',
}

function request(path: string, init?: RequestInit) {
  return app.request(path, init, testEnv)
}

function resetUpstream() {
  calls.length = 0
  upstreamStatus = 200
  upstreamType = 'text/event-stream'
  upstreamBody = 'event: token\ndata: {"text":"Hi"}\n\n'
  rejectFetch = false
}

function authorization(init: RequestInit | undefined): string | null {
  const headers = init?.headers
  if (!headers || headers instanceof Headers || Array.isArray(headers)) {
    return null
  }
  return headers.authorization ?? null
}

describe('inference proxy', () => {
  it('when the explanation id is valid, then the gateway sends the bearer secret and returns the stream', async () => {
    resetUpstream()
    const response = await request(`/api/articles/${ARTICLE_ID}/explanation`, { method: 'POST' })
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'text/event-stream')
    assert.equal(await response.text(), upstreamBody)
    assert.equal(calls[0]?.url, 'http://127.0.0.1:8000/explanations')
    assert.equal(authorization(calls[0]?.init), 'Bearer local-inference-secret')
    assert.equal(calls[0]?.init?.body, JSON.stringify({ articleId: ARTICLE_ID }))
  })

  it('when the comparison story id is valid, then the gateway posts that story id', async () => {
    resetUpstream()
    const response = await request('/api/stories/story-ports/comparison', { method: 'POST' })
    assert.equal(response.status, 200)
    assert.equal(calls[0]?.url, 'http://127.0.0.1:8000/comparisons')
    assert.equal(calls[0]?.init?.body, JSON.stringify({ storyId: 'story-ports' }))
  })

  it('when the story id is a uuid, then the comparison route returns 400', async () => {
    resetUpstream()
    const response = await request(`/api/stories/${ARTICLE_ID}/comparison`, { method: 'POST' })
    assert.equal(response.status, 400)
    assert.equal(calls.length, 0)
  })

  it('when the search query is valid, then the gateway posts that query', async () => {
    resetUpstream()
    const response = await request('/api/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'supply chain in East Asia' }),
    })
    assert.equal(response.status, 200)
    assert.equal(calls[0]?.url, 'http://127.0.0.1:8000/search')
    assert.equal(calls[0]?.init?.body, JSON.stringify({ query: 'supply chain in East Asia' }))
  })

  it('when the inference service returns 404, then the gateway returns that status', async () => {
    resetUpstream()
    upstreamStatus = 404
    upstreamType = 'application/json'
    upstreamBody = JSON.stringify({ error: 'Article not found' })
    const response = await request(`/api/articles/${ARTICLE_ID}/explanation`, { method: 'POST' })
    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), { error: 'Article not found' })
  })

  it('when Render rejects the bearer secret, then the gateway returns 503', async () => {
    resetUpstream()
    upstreamStatus = 401
    upstreamType = 'application/json'
    upstreamBody = JSON.stringify({ error: 'Unauthorized' })
    const response = await request(`/api/articles/${ARTICLE_ID}/explanation`, { method: 'POST' })
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { error: 'Inference service is unavailable' })
  })

  it('when Render is unreachable, then the gateway returns 503', async () => {
    resetUpstream()
    rejectFetch = true
    const response = await request(`/api/articles/${ARTICLE_ID}/explanation`, { method: 'POST' })
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { error: 'Inference service is unavailable' })
  })
})
