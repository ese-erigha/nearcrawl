import { AsyncLocalStorage } from 'node:async_hooks'
import { readFileSync } from 'node:fs'
import { z } from 'zod'

export const PULL_CRON = '*/17 * * * *'
export const PURGE_CRON = '0 0 * * *'
export const DAY_MS = 86_400_000

export type IngestionEnv = {
  DATABASE_URL?: string
  APITUBE_API_KEY?: string
  SENTRY_DSN?: string
  SENTRY_ENVIRONMENT?: string
  INGESTION_INTERVAL_MINUTES?: string
  FEED_RETENTION_DAYS?: string
  APITUBE_MAX_PAGES?: string
}

export type IngestionConfig = {
  databaseUrl: string
  apitubeApiKey: string
  retentionDays: number
  intervalMinutes: number
  maxPages: number
  sentryDsn: string
  sentryEnvironment: string
}

const currentConfig = new AsyncLocalStorage<IngestionConfig>()

export function runWithConfig<T>(config: IngestionConfig, run: () => Promise<T>): Promise<T> {
  return currentConfig.run(config, run)
}

export function getIngestionConfig(): IngestionConfig {
  const config = currentConfig.getStore()
  if (!config) {
    throw new Error('Ingestion config is not set')
  }
  return config
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

const scheduleSchema = z.object({
  INGESTION_INTERVAL_MINUTES: positiveInt('INGESTION_INTERVAL_MINUTES'),
  FEED_RETENTION_DAYS: positiveInt('FEED_RETENTION_DAYS'),
  APITUBE_MAX_PAGES: positiveInt('APITUBE_MAX_PAGES'),
})

const ingestionEnvSchema = scheduleSchema.extend({
  DATABASE_URL: requiredText('DATABASE_URL'),
  APITUBE_API_KEY: requiredText('APITUBE_API_KEY'),
  SENTRY_DSN: requiredText('SENTRY_DSN'),
  SENTRY_ENVIRONMENT: requiredText('SENTRY_ENVIRONMENT'),
})

export function readIngestionConfig(env: IngestionEnv): IngestionConfig {
  const data = parseConfig(ingestionEnvSchema, {
    DATABASE_URL: env.DATABASE_URL,
    APITUBE_API_KEY: env.APITUBE_API_KEY,
    SENTRY_DSN: env.SENTRY_DSN,
    SENTRY_ENVIRONMENT: wranglerVar(env, 'SENTRY_ENVIRONMENT'),
    INGESTION_INTERVAL_MINUTES: wranglerVar(env, 'INGESTION_INTERVAL_MINUTES'),
    FEED_RETENTION_DAYS: wranglerVar(env, 'FEED_RETENTION_DAYS'),
    APITUBE_MAX_PAGES: wranglerVar(env, 'APITUBE_MAX_PAGES'),
  })
  return {
    databaseUrl: data.DATABASE_URL,
    apitubeApiKey: data.APITUBE_API_KEY,
    retentionDays: data.FEED_RETENTION_DAYS,
    intervalMinutes: data.INGESTION_INTERVAL_MINUTES,
    maxPages: data.APITUBE_MAX_PAGES,
    sentryDsn: data.SENTRY_DSN,
    sentryEnvironment: data.SENTRY_ENVIRONMENT,
  }
}

export function readScheduleLimits(env: IngestionEnv = {}): {
  intervalMinutes: number
  retentionDays: number
  maxPages: number
} {
  const data = parseConfig(scheduleSchema, {
    INGESTION_INTERVAL_MINUTES: wranglerVar(env, 'INGESTION_INTERVAL_MINUTES'),
    FEED_RETENTION_DAYS: wranglerVar(env, 'FEED_RETENTION_DAYS'),
    APITUBE_MAX_PAGES: wranglerVar(env, 'APITUBE_MAX_PAGES'),
  })
  return {
    intervalMinutes: data.INGESTION_INTERVAL_MINUTES,
    retentionDays: data.FEED_RETENTION_DAYS,
    maxPages: data.APITUBE_MAX_PAGES,
  }
}

function parseConfig<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Config is invalid')
  }
  return parsed.data
}

function wranglerVar(
  env: IngestionEnv,
  name: 'INGESTION_INTERVAL_MINUTES' | 'FEED_RETENTION_DAYS' | 'APITUBE_MAX_PAGES' | 'SENTRY_ENVIRONMENT',
): string | undefined {
  const fromEnv = env[name]
  if (fromEnv) {
    return fromEnv
  }
  return readWranglerVars()[name]
}

let cachedVars: Record<string, string> | undefined

function readWranglerVars(): Record<string, string> {
  if (cachedVars) {
    return cachedVars
  }
  const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8')
  cachedVars = parseVarsSection(toml)
  return cachedVars
}

function parseVarsSection(toml: string): Record<string, string> {
  const lines = toml.split('\n')
  const start = lines.findIndex((line) => line.trim() === '[vars]')
  const parsed: Record<string, string> = {}
  if (start < 0) {
    return parsed
  }
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('[')) {
      break
    }
    const row = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"([^"]*)"\s*$/)
    const name = row?.[1]
    const value = row?.[2]
    if (name && value !== undefined) {
      parsed[name] = value
    }
  }
  return parsed
}

