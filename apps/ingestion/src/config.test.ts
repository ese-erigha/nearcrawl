import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

import { PULL_CRON, PURGE_CRON, readIngestionConfig, readScheduleLimits } from './config.ts'

describe('ingestion config', () => {
  it('when the config loads, then the interval, the retention, and the page cap come from wrangler', () => {
    const limits = readScheduleLimits()
    assert.equal(Number.isInteger(limits.intervalMinutes), true)
    assert.equal(limits.intervalMinutes > 0, true)
    assert.equal(Number.isInteger(limits.retentionDays), true)
    assert.equal(limits.retentionDays > 0, true)
    assert.equal(Number.isInteger(limits.maxPages), true)
    assert.equal(limits.maxPages > 0, true)
  })

  it('when wrangler loads, then the pull cron matches the interval and the purge cron stays off', () => {
    const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8')
    const crons = toml.match(/crons\s*=\s*\[([^\]]*)\]/)?.[1] ?? ''
    const limits = readScheduleLimits()
    assert.equal(PULL_CRON, `*/${limits.intervalMinutes} * * * *`)
    assert.equal(crons.includes(`"${PULL_CRON}"`), true)
    assert.equal(PURGE_CRON, '0 0 * * *')
    assert.equal(crons.includes(`"${PURGE_CRON}"`), false)
  })

  it('when the API key is missing, then the config read throws', () => {
    assert.throws(
      () =>
        readIngestionConfig({
          DATABASE_URL: 'postgres://local/test',
          APITUBE_API_KEY: '',
          SENTRY_DSN: 'https://local@sentry.test/1',
          SENTRY_ENVIRONMENT: 'test',
        }),
      /APITUBE_API_KEY is required/,
    )
  })

  it('when the sentry dsn is missing, then the config read throws', () => {
    assert.throws(
      () =>
        readIngestionConfig({
          DATABASE_URL: 'postgres://local/test',
          APITUBE_API_KEY: 'key',
          SENTRY_ENVIRONMENT: 'test',
        }),
      /SENTRY_DSN is required/,
    )
  })

  it('when the sentry name is omitted, then the config reads it from wrangler', () => {
    const config = readIngestionConfig({
      DATABASE_URL: 'postgres://local/test',
      APITUBE_API_KEY: 'key',
      SENTRY_DSN: 'https://local@sentry.test/1',
    })
    assert.equal(config.sentryEnvironment, 'production')
  })
})
