import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'

const reports: { status: number; route: string; requestId: string }[] = []

mock.module('./sentry.ts', {
  namedExports: {
    sentryOptions: () => ({ enabled: false }),
    reportGatewayError: (
      _error: unknown,
      fields: { status: number; route: string; requestId: string },
    ) => {
      reports.push(fields)
    },
  },
})

const { default: app } = await import('../app.ts')

describe('Sentry status reports', () => {
  it('when the response is success, then Sentry receives nothing', async () => {
    reports.length = 0
    const response = await app.request('/health')
    assert.equal(response.status, 200)
    assert.deepEqual(reports, [])
  })

  it('when the response is success, then the request id header is present', async () => {
    const response = await app.request('/health')
    assert.match(
      response.headers.get('x-request-id') ?? '',
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })

  it('when validation fails, then Sentry receives status 400', async () => {
    reports.length = 0
    const response = await app.request('/api/spatial/news')
    assert.equal(response.status, 400)
    assert.equal(reports.length, 1)
    assert.equal(reports[0]?.status, 400)
    assert.equal(reports[0]?.route, '/api/spatial/news')
  })

  it('when validation fails, then the request id header matches the Sentry report', async () => {
    reports.length = 0
    const response = await app.request('/api/spatial/news')
    assert.equal(response.headers.get('x-request-id'), reports[0]?.requestId)
  })

  it('when the article is missing, then Sentry receives status 404', async () => {
    reports.length = 0
    const response = await app.request('/api/articles/00000000-0000-4000-8000-000000000000')
    assert.equal(response.status, 404)
    assert.equal(reports.length, 1)
    assert.equal(reports[0]?.status, 404)
  })

  it('when the path is unknown, then Sentry receives status 404', async () => {
    reports.length = 0
    const response = await app.request('/missing')
    assert.equal(response.status, 404)
    assert.equal(reports.length, 1)
    assert.equal(reports[0]?.status, 404)
    assert.equal(reports[0]?.route, '/missing')
  })

  it('when the live sealer is missing, then Sentry receives status 503', async () => {
    reports.length = 0
    const response = await app.request('/api/spatial/news/live', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ bbox: [-10, -20, 10, 30] }),
    })
    assert.equal(response.status, 503)
    assert.equal(reports.length, 1)
    assert.equal(reports[0]?.status, 503)
  })
})
