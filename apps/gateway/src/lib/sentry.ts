import { captureException, logger, withScope } from '@sentry/hono/cloudflare'

import type { GatewayBindings } from '../config.ts'

export function sentryOptions(env: GatewayBindings | undefined) {
  const dsn = env?.SENTRY_DSN?.trim() ?? ''
  const enabled = dsn !== '' && env?.SENTRY_ENVIRONMENT === 'production'
  return {
    dsn: enabled ? dsn : undefined,
    enabled,
    environment: env?.SENTRY_ENVIRONMENT,
    tracesSampleRate: enabled ? 0.05 : 0,
    dataCollection: {
      userInfo: false,
      httpHeaders: false,
      httpBodies: [],
    },
  }
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
