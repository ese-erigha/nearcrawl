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

function mapError(c: AppContext, error: unknown): Response {
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

  const requestId = c.get('requestId') ?? crypto.randomUUID()
  const fields = { route: c.req.path, method: c.req.method, requestId }
  reportGatewayError(error, fields)

  if (error instanceof LiveQuerySealerMissingError) {
    return c.json({ error: error.message }, 503)
  }

  return c.json({ error: 'Internal server error' }, 500)
}
