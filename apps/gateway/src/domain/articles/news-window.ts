const HOUR_MS = 3_600_000

export function publishedAfter(retentionDays: number, windowHours?: number): Date {
  const hours = windowHours ?? retentionDays * 24
  return new Date(Date.now() - hours * HOUR_MS)
}
