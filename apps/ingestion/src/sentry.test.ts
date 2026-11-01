import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'

const errors: { job: string }[] = []
const exceptions: unknown[] = []

mock.module('@sentry/cloudflare', {
  namedExports: {
    captureException: (error: unknown) => {
      exceptions.push(error)
    },
    logger: {
      info: () => undefined,
      error: (_message: string, fields: { job: string }) => {
        errors.push(fields)
      },
    },
  },
})

const { logIngestionFailure, reportIngestionFailure } = await import('./sentry.ts')

describe('ingestion sentry', () => {
  it('when a scheduled job throws, then Sentry logs the error and leaves the Issue to the wrapper', () => {
    errors.length = 0
    exceptions.length = 0
    logIngestionFailure(new Error('database down'), '*/17 * * * *')
    assert.equal(errors.length, 1)
    assert.equal(errors[0]?.job, '*/17 * * * *')
    assert.deepEqual(exceptions, [])
  })

  it('when a local pull throws, then Sentry logs the error and opens an Issue', () => {
    errors.length = 0
    exceptions.length = 0
    const failure = new Error('APITube responded 500')
    reportIngestionFailure(failure, '*/17 * * * *')
    assert.equal(errors.length, 1)
    assert.equal(exceptions.length, 1)
    assert.equal(exceptions[0], failure)
  })
})
