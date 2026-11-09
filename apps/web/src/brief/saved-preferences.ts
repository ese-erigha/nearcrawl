import { TOPIC } from '../articles/topics.ts'

export const SAVED_PREFERENCES = {
  homeCountryCodes: ['US', 'GB', 'NG', 'DE'],
  categoryIds: [TOPIC.FINANCE, TOPIC.DISASTER],
  trackedNames: ['Osaka'],
} as const
