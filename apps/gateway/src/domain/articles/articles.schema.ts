import { z } from 'zod'

export const articleIdSchema = z.uuid()

export const countryCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{2}$/, 'country must be two letters')
  .transform((value) => value.toUpperCase())

function windowHours(maxWindowHours: number) {
  return z.coerce.number().int().min(1).max(maxWindowHours).optional()
}

function countryList(maxCountries: number) {
  return z
    .string()
    .transform((value) => value.split(','))
    .pipe(z.array(countryCodeSchema).min(1).max(maxCountries))
}

export function hotNewsQuerySchema(maxWindowHours: number, maxCountries: number) {
  return z
    .object({
      country: countryList(maxCountries),
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
