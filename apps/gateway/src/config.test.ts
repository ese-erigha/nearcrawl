import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createConfig } from './config.ts'

const limits = {
  DATABASE_URL: 'postgres://local/test',
  NEON_REALTIME_URL: 'https://local.test',
  NEON_REALTIME_SECRET: 'local-secret',
  SENTRY_DSN: 'https://local@sentry.test/1',
  SENTRY_ENVIRONMENT: 'test',
  SPATIAL_NEWS_CAP: '200',
  CATEGORY_ARTICLES_DEFAULT: '20',
  CATEGORY_ARTICLES_CAP: '100',
  FEED_RETENTION_DAYS: '14',
  HOT_NEWS_CAP: '20',
  INFERENCE_URL: 'http://127.0.0.1:8000',
  INFERENCE_SECRET: 'local-inference-secret',
}

describe('gateway config', () => {
  it('when a business limit is not a positive integer, then the config read throws', () => {
    assert.throws(
      () => createConfig({ ...limits, SPATIAL_NEWS_CAP: '0' }),
      /SPATIAL_NEWS_CAP must be a positive integer/,
    )
  })

  it('when the database url is missing, then the config read throws', () => {
    assert.throws(() => createConfig({ ...limits, DATABASE_URL: '' }), /DATABASE_URL is required/)
  })

  it('when the category default exceeds the cap, then the config read throws', () => {
    assert.throws(
      () => createConfig({ ...limits, CATEGORY_ARTICLES_DEFAULT: '200', CATEGORY_ARTICLES_CAP: '100' }),
      /CATEGORY_ARTICLES_DEFAULT exceeds CATEGORY_ARTICLES_CAP/,
    )
  })
})
