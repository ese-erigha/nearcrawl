import { Hono } from 'hono'

import { handleErrors } from '../../lib/errors.ts'
import type { ControllerContext } from '../../types.ts'
import { articleIdSchema, hotNewsQuerySchema } from './articles.schema.ts'
import { explainArticle } from './usecases/explain-article.usecase.ts'
import { getArticle } from './usecases/get-article.usecase.ts'
import { listHotNews } from './usecases/list-hot-news.usecase.ts'
import { sealArticle } from './usecases/seal-article.usecase.ts'

const app = new Hono<ControllerContext>()

app.get(
  '/',
  handleErrors(async (c) => {
    const query = hotNewsQuerySchema.parse(c.req.query())
    const response = await listHotNews(query.country)
    return c.json(response)
  }),
)

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

app.post(
  '/:id/explanation',
  handleErrors(async (c) => {
    const id = articleIdSchema.parse(c.req.param('id'))
    return explainArticle(id)
  }),
)

export default app
