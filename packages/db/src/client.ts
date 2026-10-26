import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import * as schema from './schema/index.ts'

export function createDbClient(databaseUrl: string) {
  return drizzle(neon(databaseUrl), { schema })
}

export type DbClient = ReturnType<typeof createDbClient>
