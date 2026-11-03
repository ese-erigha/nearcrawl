import { z } from 'zod'

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
  INFERENCE_URL?: string
  INFERENCE_SECRET?: string
}

export interface AppConfig {
  databaseUrl: string
  neonRealtimeUrl: string
  neonRealtimeSecret: string
  sentryDsn: string
  sentryEnvironment: string
  spatialNewsCap: number
  categoryArticlesDefault: number
  categoryArticlesCap: number
  feedRetentionDays: number
  hotNewsCap: number
  inferenceUrl: string
  inferenceSecret: string
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
    INFERENCE_URL: textValue(env.INFERENCE_URL),
    INFERENCE_SECRET: textValue(env.INFERENCE_SECRET),
  }
}

const positiveInt = (name: string) =>
  z
    .string({ error: `${name} must be a positive integer` })
    .regex(/^[1-9]\d*$/, { error: `${name} must be a positive integer` })
    .transform(Number)

const requiredText = (name: string) =>
  z
    .string({ error: `${name} is required` })
    .trim()
    .min(1, { error: `${name} is required` })

const gatewayConfigSchema = z
  .object({
    DATABASE_URL: requiredText('DATABASE_URL'),
    NEON_REALTIME_URL: requiredText('NEON_REALTIME_URL'),
    NEON_REALTIME_SECRET: requiredText('NEON_REALTIME_SECRET'),
    SENTRY_DSN: requiredText('SENTRY_DSN'),
    SENTRY_ENVIRONMENT: requiredText('SENTRY_ENVIRONMENT'),
    SPATIAL_NEWS_CAP: positiveInt('SPATIAL_NEWS_CAP'),
    CATEGORY_ARTICLES_DEFAULT: positiveInt('CATEGORY_ARTICLES_DEFAULT'),
    CATEGORY_ARTICLES_CAP: positiveInt('CATEGORY_ARTICLES_CAP'),
    FEED_RETENTION_DAYS: positiveInt('FEED_RETENTION_DAYS'),
    HOT_NEWS_CAP: positiveInt('HOT_NEWS_CAP'),
    INFERENCE_URL: requiredText('INFERENCE_URL').refine(isInferenceOrigin, {
      error: 'INFERENCE_URL is an origin with no path',
    }),
    INFERENCE_SECRET: requiredText('INFERENCE_SECRET'),
  })
  .refine((value) => value.CATEGORY_ARTICLES_DEFAULT <= value.CATEGORY_ARTICLES_CAP, {
    error: 'CATEGORY_ARTICLES_DEFAULT exceeds CATEGORY_ARTICLES_CAP',
  })

export function createConfig(raw: unknown): AppConfig {
  const env = businessVars(readBindings(raw))
  const data = parseConfig(gatewayConfigSchema, env)
  return {
    databaseUrl: data.DATABASE_URL,
    neonRealtimeUrl: data.NEON_REALTIME_URL,
    neonRealtimeSecret: data.NEON_REALTIME_SECRET,
    sentryDsn: data.SENTRY_DSN,
    sentryEnvironment: data.SENTRY_ENVIRONMENT,
    spatialNewsCap: data.SPATIAL_NEWS_CAP,
    categoryArticlesDefault: data.CATEGORY_ARTICLES_DEFAULT,
    categoryArticlesCap: data.CATEGORY_ARTICLES_CAP,
    feedRetentionDays: data.FEED_RETENTION_DAYS,
    hotNewsCap: data.HOT_NEWS_CAP,
    inferenceUrl: data.INFERENCE_URL,
    inferenceSecret: data.INFERENCE_SECRET,
  }
}

function isInferenceOrigin(value: string): boolean {
  try {
    const url = new URL(value)
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:'
    return isHttp && url.pathname === '/' && url.search === '' && url.hash === ''
  } catch {
    return false
  }
}

function parseConfig<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Config is invalid')
  }
  return parsed.data
}

function businessVars(env: GatewayBindings): GatewayBindings {
  if (
    env.SPATIAL_NEWS_CAP &&
    env.CATEGORY_ARTICLES_DEFAULT &&
    env.CATEGORY_ARTICLES_CAP &&
    env.FEED_RETENTION_DAYS &&
    env.HOT_NEWS_CAP &&
    env.SENTRY_ENVIRONMENT
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
    SENTRY_ENVIRONMENT: env.SENTRY_ENVIRONMENT ?? vars.SENTRY_ENVIRONMENT,
  }
}

function textValue(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}
