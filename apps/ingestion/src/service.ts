import { readFileSync } from 'node:fs'

const vars = readWranglerVars()

export const service = {
  name: 'ingestion',
  intervalMinutes: requiredInt(vars.INGESTION_INTERVAL_MINUTES, 'INGESTION_INTERVAL_MINUTES'),
  retentionDays: requiredInt(vars.FEED_RETENTION_DAYS, 'FEED_RETENTION_DAYS'),
} as const

function readWranglerVars(): Record<string, string> {
  const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8')
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

function requiredInt(value: string | undefined, name: string): number {
  if (value === undefined || !/^[1-9]\d*$/.test(value)) {
    throw new Error(`${name} must be a positive integer`)
  }
  return Number(value)
}
