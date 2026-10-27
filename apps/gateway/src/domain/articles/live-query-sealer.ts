import { createRealtime, rawSql, type RawSqlParameter } from '@neon/realtime/server'
import type { CompiledSql } from 'db'

import { getConfig } from '../../lib/context.ts'

export interface LiveQuerySealer {
  seal(query: CompiledSql): Promise<unknown>
}

export function getLiveQuerySealer(): LiveQuerySealer | null {
  const config = getConfig()
  if (!config.neonRealtimeUrl || !config.neonRealtimeSecret) {
    return null
  }

  const realtime = createRealtime({
    secret: config.neonRealtimeSecret,
    db: databaseName(config.databaseUrl),
  })

  return {
    async seal(query) {
      return realtime.seal({ query: rawSql(query.sql, scalarParameters(query.params)) })
    },
  }
}

function scalarParameters(params: readonly unknown[]): RawSqlParameter[] {
  return params.map((param) => {
    if (
      param === null ||
      typeof param === 'string' ||
      typeof param === 'number' ||
      typeof param === 'boolean' ||
      typeof param === 'bigint'
    ) {
      return param
    }
    throw new Error('Live query parameter must be a scalar')
  })
}

function databaseName(databaseUrl: string | undefined): string {
  if (!databaseUrl) {
    return 'neondb'
  }
  const pathname = new URL(databaseUrl).pathname.replace(/^\//, '')
  return pathname === '' ? 'neondb' : pathname
}
