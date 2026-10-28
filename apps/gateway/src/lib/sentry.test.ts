import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'

const warnings: { status: number }[] = []
const errors: { status: number }[] = []
const exceptions: unknown[] = []

mock.module('@sentry/hono/cloudflare', {
  namedExports: {
    captureException: (error: unknown) => {
      exceptions.push(error)
    },
    logger: {
      warn: (_message: string, fields: { status: number }) => {
        warnings.push(fields)
      },
      error: (_message: string, fields: { status: number }) => {
        errors.push(fields)
      },
    },
    withScope: (
      callback: (scope: {
        setLevel: (level: string) => void
        setTag: (key: string, value: string) => void
        setContext: (key: string, value: unknown) => void
      }) => void,
    ) => {
      callback({
        setLevel: () => undefined,
        setTag: () => undefined,
        setContext: () => undefined,
      })
    },
  },
})

const { reportGatewayError } = await import('./sentry.ts')

const fields = {
  route: '/api/spatial/news',
  method: 'GET',
  requestId: '4f1c0c3e-1f4a-4a0e-9c1d-2a6f0b9e8d11',
}

describe('reportGatewayError', () => {
  it('when the status is a client error, then Sentry logs a warning and skips the Issue', async () => {
    warnings.length = 0
    errors.length = 0
    exceptions.length = 0
    reportGatewayError(new Error('Validation failed'), { ...fields, status: 400 })
    assert.equal(warnings.length, 1)
    assert.equal(warnings[0]?.status, 400)
    assert.deepEqual(errors, [])
    assert.deepEqual(exceptions, [])
  })

  it('when the status is a server error, then Sentry logs an error and opens an Issue', async () => {
    warnings.length = 0
    errors.length = 0
    exceptions.length = 0
    const failure = new Error('database down')
    reportGatewayError(failure, { ...fields, status: 500 })
    assert.deepEqual(warnings, [])
    assert.equal(errors.length, 1)
    assert.equal(errors[0]?.status, 500)
    assert.equal(exceptions.length, 1)
    assert.equal(exceptions[0], failure)
  })
})
