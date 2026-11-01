import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'

import { runWithConfig, type IngestionConfig } from '../config.ts'

let retentionDays: number | undefined
let purged = 0

mock.module('db', {
  namedExports: {
    DbArticleRepository: class {
      purgeOlderThan(days: number) {
        retentionDays = days
        purged = 3
        return Promise.resolve(purged)
      }
    },
  },
})

const { purgeArticles } = await import('./purge-articles.ts')

const config: IngestionConfig = {
  databaseUrl: 'postgres://local/test',
  apitubeApiKey: '',
  retentionDays: 14,
  intervalMinutes: 17,
  maxPages: 100,
  sentryDsn: 'https://local@sentry.test/1',
  sentryEnvironment: 'test',
}

describe('purgeArticles', () => {
  it('when the purge runs, then it deletes rows older than the retention window', async () => {
    retentionDays = undefined
    const count = await runWithConfig(config, () => purgeArticles())
    assert.equal(retentionDays, 14)
    assert.equal(count, 3)
  })
})
