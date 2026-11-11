import { z } from 'zod'

import { countryCodeSchema } from '../articles/articles.schema.ts'

export const briefQuerySchema = z
  .object({
    country: countryCodeSchema,
  })
  .strict()
