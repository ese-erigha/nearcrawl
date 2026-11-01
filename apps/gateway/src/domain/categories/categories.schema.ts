import { z } from 'zod'

export const categoryPathSchema = z.coerce.number().int().positive()

export function categoryArticlesQuerySchema(limits: { cap: number; defaultLimit: number }) {
  return z
    .object({
      limit: z.coerce.number().int().min(1).max(limits.cap).optional().default(limits.defaultLimit),
    })
    .strict()
}
