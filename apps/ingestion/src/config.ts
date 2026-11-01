import { AsyncLocalStorage } from 'node:async_hooks'
import { readFileSync } from 'node:fs'

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
  sentryEnvironment: string | undefined
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

export function readIngestionConfig(env: IngestionEnv): IngestionConfig {
  return {
    databaseUrl: requiredText(env.DATABASE_URL, 'DATABASE_URL'),
    apitubeApiKey: env.APITUBE_API_KEY?.trim() ?? '',
    retentionDays: requiredInt(limitValue(env, 'FEED_RETENTION_DAYS'), 'FEED_RETENTION_DAYS'),
    intervalMinutes: requiredInt(limitValue(env, 'INGESTION_INTERVAL_MINUTES'), 'INGESTION_INTERVAL_MINUTES'),
    maxPages: requiredInt(limitValue(env, 'APITUBE_MAX_PAGES'), 'APITUBE_MAX_PAGES'),
    sentryDsn: env.SENTRY_DSN?.trim() ?? '',
    sentryEnvironment: env.SENTRY_ENVIRONMENT,
  }
}

export function readScheduleLimits(env: IngestionEnv = {}): {
  intervalMinutes: number
  retentionDays: number
  maxPages: number
} {
  return {
    intervalMinutes: requiredInt(limitValue(env, 'INGESTION_INTERVAL_MINUTES'), 'INGESTION_INTERVAL_MINUTES'),
    retentionDays: requiredInt(limitValue(env, 'FEED_RETENTION_DAYS'), 'FEED_RETENTION_DAYS'),
    maxPages: requiredInt(limitValue(env, 'APITUBE_MAX_PAGES'), 'APITUBE_MAX_PAGES'),
  }
}

function limitValue(
  env: IngestionEnv,
  name: 'INGESTION_INTERVAL_MINUTES' | 'FEED_RETENTION_DAYS' | 'APITUBE_MAX_PAGES',
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

function requiredText(value: string | undefined, name: string): string {
  const text = value?.trim() ?? ''
  if (!text) {
    throw new Error(`${name} is required`)
  }
  return text
}

function requiredInt(value: string | undefined, name: string): number {
  if (value === undefined || !/^[1-9]\d*$/.test(value)) {
    throw new Error(`${name} must be a positive integer`)
  }
  return Number(value)
}
