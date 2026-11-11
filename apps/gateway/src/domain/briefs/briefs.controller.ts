import { Hono } from 'hono'

import { handleErrors } from '../../lib/errors.ts'
import type { ControllerContext } from '../../types.ts'
import { briefQuerySchema } from './briefs.schema.ts'
import { getDailyBrief } from './get-daily-brief.usecase.ts'

const app = new Hono<ControllerContext>()

app.get(
  '/',
  handleErrors(async (c) => {
    const query = briefQuerySchema.parse(c.req.query())
    const response = await getDailyBrief(query.country)
    return c.json(response)
  }),
)

export default app
