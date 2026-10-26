const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

let host
try {
  host = new URL(databaseUrl).hostname
} catch {
  console.error('DATABASE_URL is not a valid URL')
  process.exit(1)
}

if (host.includes('-pooler')) {
  console.error('Migrations refuse a pooled Neon host')
  process.exit(1)
}
