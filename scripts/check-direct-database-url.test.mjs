import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { it } from 'node:test'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('./check-direct-database-url.mjs', import.meta.url))

function runCheck(databaseUrl) {
  const env = { ...process.env }
  if (databaseUrl === undefined) {
    delete env.DATABASE_URL
  } else {
    env.DATABASE_URL = databaseUrl
  }
  return spawnSync(process.execPath, [script], { env, encoding: 'utf8' })
}

it('when the Neon host is direct, then the check exits 0', () => {
  const result = runCheck(
    'postgresql://owner:secret@ep-example.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require',
  )
  assert.equal(result.status, 0)
})

it('when the Neon host is pooled, then the check exits 1', () => {
  const result = runCheck(
    'postgresql://owner:secret@ep-example-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require',
  )
  assert.equal(result.status, 1)
  assert.match(result.stderr, /pooled Neon host/)
})

it('when DATABASE_URL is missing, then the check exits 1', () => {
  const result = runCheck(undefined)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /DATABASE_URL is required/)
})
