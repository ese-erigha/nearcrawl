import { ZodError } from 'zod'

import type { AppContext } from '../types.ts'
import { reportGatewayError } from './sentry.ts'

export class NotFoundError extends Error {
  constructor(message = 'Article not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class LiveQuerySealerMissingError extends Error {
  constructor() {
    super('Live query sealer is not configured')
    this.name = 'LiveQuerySealerMissingError'
  }
}

export function handleErrors(handler: (c: AppContext) => Promise<Response>) {
  return async (c: AppContext): Promise<Response> => {
    try {
      return await handler(c)
    } catch (error) {
      return mapError(c, error)
    }
  }
}

export function reportUnhappyStatus(c: AppContext): void {
  const status = c.res.status
  if (status >= 200 && status < 300) return
  const requestId = c.get('requestId') ?? crypto.randomUUID()
  const error = c.get('sentryError') ?? new Error(`HTTP ${status}`)
  reportGatewayError(error, {
    route: c.req.path,
    method: c.req.method,
    requestId,
    status,
  })
}

function mapError(c: AppContext, error: unknown): Response {
  c.set('sentryError', error)

  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
    return c.json({ error: 'Validation failed', details }, 400)
  }

  if (error instanceof NotFoundError) {
    return c.json({ error: error.message }, 404)
  }

  if (error instanceof LiveQuerySealerMissingError) {
    return c.json({ error: error.message }, 503)
  }

  return c.json({ error: 'Internal server error' }, 500)
}
