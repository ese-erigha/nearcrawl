import { z } from 'zod'

export const articleIdSchema = z.uuid()

const countryCode = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{2}$/, 'country must be two letters')
  .transform((value) => value.toUpperCase())

function windowHours(maxWindowHours: number) {
  return z.coerce.number().int().min(1).max(maxWindowHours).optional()
}

export function hotNewsQuerySchema(maxWindowHours: number) {
  return z
    .object({
      country: countryCode,
      windowHours: windowHours(maxWindowHours),
    })
    .strict()
}

export function mentionQuerySchema(maxWindowHours: number) {
  return z
    .object({
      q: z.string().trim().min(2).max(80),
      windowHours: windowHours(maxWindowHours),
    })
    .strict()
}
