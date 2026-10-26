import { service } from './service.ts'

console.log(
  `${service.name} ready, every ${service.intervalMinutes} minutes, ${service.retentionDays} day feed`,
)

await new Promise(() => {})
