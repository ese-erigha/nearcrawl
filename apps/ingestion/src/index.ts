import { pathToFileURL } from 'node:url'

import { withSentry } from '@sentry/cloudflare'

import { PULL_CRON, PURGE_CRON, readIngestionConfig, runWithConfig, type IngestionEnv } from './config.ts'
import { pullNews } from './pull-news/pull-news.ts'
import { purgeArticles } from './purge-articles/purge-articles.ts'
import { logIngestionFailure, logPullCounts, logPurgeCount, reportIngestionFailure, sentryOptions } from './sentry.ts'

export default withSentry((env: IngestionEnv) => sentryOptions(env), {
  async scheduled(controller: { cron: string }, env: IngestionEnv) {
    try {
      await runScheduled(controller.cron, env)
    } catch (error) {
      logIngestionFailure(error, controller.cron)
      throw error
    }
  },
})

async function runScheduled(cron: string, env: IngestionEnv): Promise<void> {
  const config = readIngestionConfig(env)
  if (cron === PULL_CRON) {
    const counts = await runWithConfig(config, () => pullNews())
    logPullCounts(counts)
    return
  }
  if (cron === PURGE_CRON) {
    const purged = await runWithConfig(config, () => purgeArticles())
    logPurgeCount(purged)
    return
  }
  throw new Error(`Unknown cron ${cron}`)
}

async function runLocal(): Promise<void> {
  try {
    const counts = await runWithConfig(readIngestionConfig(localEnv()), () => pullNews())
    logPullCounts(counts)
  } catch (error) {
    reportIngestionFailure(error, PULL_CRON)
    throw error
  }
}

function localEnv(): IngestionEnv {
  return {
    DATABASE_URL: process.env.DATABASE_URL,
    APITUBE_API_KEY: process.env.APITUBE_API_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT,
    INGESTION_INTERVAL_MINUTES: process.env.INGESTION_INTERVAL_MINUTES,
    FEED_RETENTION_DAYS: process.env.FEED_RETENTION_DAYS,
    APITUBE_MAX_PAGES: process.env.APITUBE_MAX_PAGES,
  }
}

function isDirectRun(): boolean {
  if (typeof process === 'undefined' || !process.argv[1]) {
    return false
  }
  return import.meta.url === pathToFileURL(process.argv[1]).href
}

if (isDirectRun()) {
  await runLocal()
}
