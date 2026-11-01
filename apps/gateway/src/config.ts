import { readWranglerVars } from './wrangler-vars.ts'

export interface GatewayBindings {
  DATABASE_URL?: string
  NEON_REALTIME_URL?: string
  NEON_REALTIME_SECRET?: string
  SENTRY_DSN?: string
  SENTRY_ENVIRONMENT?: string
  SPATIAL_NEWS_CAP?: string
  CATEGORY_ARTICLES_DEFAULT?: string
  CATEGORY_ARTICLES_CAP?: string
  FEED_RETENTION_DAYS?: string
  HOT_NEWS_CAP?: string
}

export interface AppConfig {
  databaseUrl?: string
  neonRealtimeUrl?: string
  neonRealtimeSecret?: string
  sentryDsn?: string
  sentryEnvironment?: string
  spatialNewsCap: number
  categoryArticlesDefault: number
  categoryArticlesCap: number
  feedRetentionDays: number
  hotNewsCap: number
}

export function readBindings(raw: unknown): GatewayBindings {
  if (!raw || typeof raw !== 'object') {
    return {}
  }

  const env = raw as Record<string, unknown>
  return {
    DATABASE_URL: textValue(env.DATABASE_URL),
    NEON_REALTIME_URL: textValue(env.NEON_REALTIME_URL),
    NEON_REALTIME_SECRET: textValue(env.NEON_REALTIME_SECRET),
    SENTRY_DSN: textValue(env.SENTRY_DSN),
    SENTRY_ENVIRONMENT: textValue(env.SENTRY_ENVIRONMENT),
    SPATIAL_NEWS_CAP: textValue(env.SPATIAL_NEWS_CAP),
    CATEGORY_ARTICLES_DEFAULT: textValue(env.CATEGORY_ARTICLES_DEFAULT),
    CATEGORY_ARTICLES_CAP: textValue(env.CATEGORY_ARTICLES_CAP),
    FEED_RETENTION_DAYS: textValue(env.FEED_RETENTION_DAYS),
    HOT_NEWS_CAP: textValue(env.HOT_NEWS_CAP),
  }
}

export function createConfig(raw: unknown): AppConfig {
  const env = businessVars(readBindings(raw))
  const spatialNewsCap = requiredInt(env.SPATIAL_NEWS_CAP, 'SPATIAL_NEWS_CAP')
  const categoryArticlesDefault = requiredInt(env.CATEGORY_ARTICLES_DEFAULT, 'CATEGORY_ARTICLES_DEFAULT')
  const categoryArticlesCap = requiredInt(env.CATEGORY_ARTICLES_CAP, 'CATEGORY_ARTICLES_CAP')
  const feedRetentionDays = requiredInt(env.FEED_RETENTION_DAYS, 'FEED_RETENTION_DAYS')
  const hotNewsCap = requiredInt(env.HOT_NEWS_CAP, 'HOT_NEWS_CAP')
  if (categoryArticlesDefault > categoryArticlesCap) {
    throw new Error('CATEGORY_ARTICLES_DEFAULT exceeds CATEGORY_ARTICLES_CAP')
  }
  return {
    databaseUrl: env.DATABASE_URL,
    neonRealtimeUrl: env.NEON_REALTIME_URL,
    neonRealtimeSecret: env.NEON_REALTIME_SECRET,
    sentryDsn: env.SENTRY_DSN,
    sentryEnvironment: env.SENTRY_ENVIRONMENT,
    spatialNewsCap,
    categoryArticlesDefault,
    categoryArticlesCap,
    feedRetentionDays,
    hotNewsCap,
  }
}

function businessVars(env: GatewayBindings): GatewayBindings {
  if (
    env.SPATIAL_NEWS_CAP &&
    env.CATEGORY_ARTICLES_DEFAULT &&
    env.CATEGORY_ARTICLES_CAP &&
    env.FEED_RETENTION_DAYS &&
    env.HOT_NEWS_CAP
  ) {
    return env
  }
  const vars = readWranglerVars()
  return {
    ...env,
    SPATIAL_NEWS_CAP: env.SPATIAL_NEWS_CAP ?? vars.SPATIAL_NEWS_CAP,
    CATEGORY_ARTICLES_DEFAULT: env.CATEGORY_ARTICLES_DEFAULT ?? vars.CATEGORY_ARTICLES_DEFAULT,
    CATEGORY_ARTICLES_CAP: env.CATEGORY_ARTICLES_CAP ?? vars.CATEGORY_ARTICLES_CAP,
    FEED_RETENTION_DAYS: env.FEED_RETENTION_DAYS ?? vars.FEED_RETENTION_DAYS,
    HOT_NEWS_CAP: env.HOT_NEWS_CAP ?? vars.HOT_NEWS_CAP,
  }
}

function requiredInt(value: string | undefined, name: string): number {
  if (value === undefined || !/^[1-9]\d*$/.test(value)) {
    throw new Error(`${name} must be a positive integer`)
  }
  return Number(value)
}

function textValue(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}
