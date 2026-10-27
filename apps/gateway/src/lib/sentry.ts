import { captureException, logger, withScope } from '@sentry/node'
import { init } from '@sentry/hono/node'

import type { GatewayBindings } from '../config.ts'

let started = false

export function initSentry(env: GatewayBindings = process.env): void {
  if (started) {
    return
  }

  const dsn = env.SENTRY_DSN?.trim() ?? ''
  if (dsn === '' || env.SENTRY_ENVIRONMENT !== 'production') {
    return
  }

  started = true
  init({
    dsn,
    environment: env.SENTRY_ENVIRONMENT,
    tracesSampleRate: 0.05,
    dataCollection: {
      userInfo: false,
      httpHeaders: false,
      httpBodies: [],
    },
  })
}

export function reportGatewayError(
  error: unknown,
  fields: { route: string; method: string; requestId: string },
): void {
  withScope((scope) => {
    scope.setTag('requestId', fields.requestId)
    scope.setContext('request', fields)
    captureException(error)
    logger.error(error instanceof Error ? error.message : 'Internal server error', fields)
  })
}
