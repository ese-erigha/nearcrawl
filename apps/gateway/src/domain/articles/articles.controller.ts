import { Hono } from 'hono'

import { handleErrors } from '../../lib/errors.ts'
import type { ControllerContext } from '../../types.ts'
import { articleIdSchema } from './articles.validation.ts'
import { getArticle } from './usecases/get-article.usecase.ts'
import { sealArticle } from './usecases/seal-article.usecase.ts'

const app = new Hono<ControllerContext>()

app.get(
  '/:id',
  handleErrors(async (c) => {
    const id = articleIdSchema.parse(c.req.param('id'))
    const article = await getArticle(id)
    return c.json(article)
  }),
)

app.post(
  '/:id/live',
  handleErrors(async (c) => {
    const id = articleIdSchema.parse(c.req.param('id'))
    const response = await sealArticle(id)
    return c.json(response)
  }),
)

export default app
