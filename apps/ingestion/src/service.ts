export const INGESTION_INTERVAL_MINUTES = 10
export const FEED_RETENTION_DAYS = 14

export const service = {
  name: 'ingestion',
  intervalMinutes: INGESTION_INTERVAL_MINUTES,
  retentionDays: FEED_RETENTION_DAYS,
} as const
