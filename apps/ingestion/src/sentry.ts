import { captureException, logger } from '@sentry/cloudflare'

import type { IngestionEnv } from './config.ts'
import type { PullCounts } from './pull-news/pull-news.ts'

export function sentryOptions(env: IngestionEnv | undefined) {
  const dsn = env?.SENTRY_DSN?.trim() ?? ''
  const enabled = dsn !== '' && env?.SENTRY_ENVIRONMENT === 'production'
  return {
    dsn: enabled ? dsn : undefined,
    enabled,
    environment: env?.SENTRY_ENVIRONMENT,
    tracesSampleRate: enabled ? 0.05 : 0,
    dataCollection: {
      userInfo: false,
      httpHeaders: false,
      httpBodies: [],
    },
  }
}

export function warnSkippedArticle(apitubeId: string, medtopIds: readonly string[]): void {
  console.warn(`article skipped, apitube id ${apitubeId}, medtop ids ${medtopIds}`)
  logger.warn('article skipped', { apitubeId, medtopIds })
}

export function warnUnknownMedtop(medtopId: string): void {
  console.warn(`unknown medtop ${medtopId}`)
  logger.warn('unknown medtop', { medtopId })
}

export function logPullCounts(counts: PullCounts): void {
  console.log(
    `pull finished, pulled ${counts.pulled}, upserted ${counts.upserted}, skipped ${counts.skipped}, unknown topics ${counts.unknownTopics}`,
  )
  logger.info('pull finished', counts)
}

export function logPurgeCount(purged: number): void {
  console.log(`purge finished, purged ${purged}`)
  logger.info('purge finished', { purged })
}

export function logIngestionFailure(error: unknown, job: string): void {
  logger.error(error instanceof Error ? error.message : 'Ingestion failed', { job })
}

export function reportIngestionFailure(error: unknown, job: string): void {
  captureException(error)
  logIngestionFailure(error, job)
}
