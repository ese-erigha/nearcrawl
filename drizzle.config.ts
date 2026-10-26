import { defineConfig } from 'drizzle-kit'

const databaseUrl = process.env.DATABASE_URL

export default defineConfig({
  dialect: 'postgresql',
  schema: './packages/db/src/schema/index.ts',
  out: './infra/migrations',
  dbCredentials: {
    url: databaseUrl ?? '',
  },
})
