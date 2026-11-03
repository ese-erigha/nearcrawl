import { Hono } from 'hono'

import { handleErrors } from '../../lib/errors.ts'
import type { ControllerContext } from '../../types.ts'
import { searchBodySchema } from './search.schema.ts'
import { searchNews } from './usecases/search-news.usecase.ts'

const app = new Hono<ControllerContext>()

app.post(
  '/',
  handleErrors(async (c) => {
    const body = searchBodySchema.parse(await c.req.json())
    return searchNews(body.query)
  }),
)

export default app
