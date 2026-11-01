import { z } from 'zod'

export const articleIdSchema = z.uuid()

export const hotNewsQuerySchema = z
  .object({
    country: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{2}$/, 'country must be two letters')
      .transform((value) => value.toUpperCase()),
  })
  .strict()
