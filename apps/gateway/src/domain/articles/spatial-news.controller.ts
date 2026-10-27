import { Hono } from 'hono'

import { handleErrors } from '../../lib/errors.ts'
import type { ControllerContext } from '../../types.ts'
import { spatialNewsLiveBodySchema, spatialNewsQuerySchema } from './articles.validation.ts'
import { listSpatialNews } from './usecases/list-spatial-news.usecase.ts'
import { sealSpatialNews } from './usecases/seal-spatial-news.usecase.ts'

const app = new Hono<ControllerContext>()

app.get(
  '/',
  handleErrors(async (c) => {
    const query = spatialNewsQuerySchema.parse(c.req.query())
    const response = await listSpatialNews(query)
    return c.json(response)
  }),
)

app.post(
  '/live',
  handleErrors(async (c) => {
    const body: unknown = await c.req.json().catch(() => ({}))
    const parsed = spatialNewsLiveBodySchema.parse(body)
    const response = await sealSpatialNews(parsed)
    return c.json(response)
  }),
)

export default app
