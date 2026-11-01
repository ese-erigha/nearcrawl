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

  it('when wrangler loads, then the pull cron is scheduled and the purge cron is off', () => {
    const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8')
    const crons = toml.match(/crons\s*=\s*\[([^\]]*)\]/)?.[1] ?? ''
    const limits = readScheduleLimits()
    assert.equal(PULL_CRON, `*/${limits.intervalMinutes} * * * *`)
    assert.equal(crons.includes(`"${PULL_CRON}"`), true)
    assert.equal(PURGE_CRON, '0 0 * * *')
    assert.equal(crons.includes(`"${PURGE_CRON}"`), false)
  })

  it('when the environment has no sentry name, then the config leaves sentry off', () => {
    const config = readIngestionConfig({
      DATABASE_URL: 'postgres://local/test',
      APITUBE_API_KEY: 'key',
    })
    assert.equal(config.sentryEnvironment, undefined)
    assert.equal(config.sentryDsn, '')
    assert.equal(config.retentionDays > 0, true)
  })
})
