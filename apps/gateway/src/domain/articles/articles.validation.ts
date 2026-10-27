import { isCategoryId } from 'db'
import { z } from 'zod'

import type { BBox } from './articles.types.ts'

const categoryIdSchema = z.coerce
  .number()
  .int()
  .positive()
  .refine((value) => isCategoryId(value), { message: 'Unknown category' })

export const spatialNewsQuerySchema = z
  .object({
    bbox: z.string().transform((value, ctx) => parseBBoxText(value, ctx)),
    categoryId: categoryIdSchema.optional(),
  })
  .strict()

export const spatialNewsLiveBodySchema = z
  .object({
    bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).transform((value, ctx) => {
      return numbersToBBox(value, ctx)
    }),
    categoryId: categoryIdSchema.optional(),
  })
  .strict()

export const articleIdSchema = z.uuid()

function parseBBoxText(value: string, ctx: z.RefinementCtx): BBox {
  const parts = value.split(',')
  if (parts.length !== 4) {
    ctx.addIssue({ code: 'custom', message: 'bbox must be west,south,east,north' })
    return { west: 0, south: 0, east: 0, north: 0 }
  }

  const numbers = parts.map((part) => Number(part))
  return numbersToBBox(numbers, ctx)
}

function numbersToBBox(values: readonly number[], ctx: z.RefinementCtx): BBox {
  const [west, south, east, north] = values
  if (
    west === undefined ||
    south === undefined ||
    east === undefined ||
    north === undefined ||
    values.some((value) => !Number.isFinite(value))
  ) {
    ctx.addIssue({ code: 'custom', message: 'bbox must be four decimal degrees' })
    return { west: 0, south: 0, east: 0, north: 0 }
  }

  if (south < -90 || south > 90 || north < -90 || north > 90 || south > north) {
    ctx.addIssue({
      code: 'custom',
      message: 'Latitude must be between -90 and 90, and south must not exceed north',
    })
  }

  if (west < -180 || west > 180 || east < -180 || east > 180) {
    ctx.addIssue({ code: 'custom', message: 'Longitude must be between -180 and 180' })
  }

  return { west, south, east, north }
}

export type SpatialNewsInput = {
  bbox: BBox
  categoryId?: number
}
