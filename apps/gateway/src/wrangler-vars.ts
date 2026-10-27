import { readFileSync } from 'node:fs'

let cachedVars: Record<string, string> | undefined

export function readWranglerVars(): Record<string, string> {
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
  const vars: Record<string, string> = {}
  if (start < 0) {
    return vars
  }
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('[')) {
      break
    }
    const parsed = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"([^"]*)"\s*$/)
    const name = parsed?.[1]
    const value = parsed?.[2]
    if (name && value !== undefined) {
      vars[name] = value
    }
  }
  return vars
}
