import { getContext } from 'hono/context-storage'

import type { AppConfig } from '../config.ts'
import type { ControllerContext } from '../types.ts'

export function getConfig(): AppConfig {
  const config = getContext<ControllerContext>().var.config
  if (!config) {
    throw new Error('Configuration not initialized')
  }
  return config
}

export function getRequestId(): string | undefined {
  return getContext<ControllerContext>().var.requestId
}
