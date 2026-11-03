import { z } from 'zod'

export const searchBodySchema = z
  .object({
    query: z.string().trim().min(1).max(500),
  })
  .strict()
