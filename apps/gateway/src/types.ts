import type { Context } from 'hono'

import type { AppConfig, GatewayBindings } from './config.ts'

export interface Variables {
  config?: AppConfig
  requestId?: string
  userId?: string
  sentryError?: unknown
}

export type ControllerContext = {
  Bindings: GatewayBindings
  Variables: Variables
}

export type AppContext = Context<ControllerContext>
