import { Hono } from 'hono'

import { getConfig } from '../../lib/context.ts'
import { handleErrors } from '../../lib/errors.ts'
import type { ControllerContext } from '../../types.ts'
import { articleIdSchema, hotNewsQuerySchema, mentionQuerySchema } from './articles.schema.ts'
import { explainArticle } from './usecases/explain-article.usecase.ts'
import { getArticle } from './usecases/get-article.usecase.ts'
import { listBreakingNews } from './usecases/list-breaking-news.usecase.ts'
import { listHotNews } from './usecases/list-hot-news.usecase.ts'
import { listMentions } from './usecases/list-mentions.usecase.ts'
import { sealArticle } from './usecases/seal-article.usecase.ts'

const app = new Hono<ControllerContext>()

const HOURS_PER_DAY = 24

app.get(
  '/',
  handleErrors(async (c) => {
    const config = getConfig()
    const query = hotNewsQuerySchema(config.feedRetentionDays * HOURS_PER_DAY, config.hotCountryCap).parse(c.req.query())
    const response = await listHotNews(query.country, query.windowHours)
    return c.json(response)
  }),
)

app.get(
  '/breaking',
  handleErrors(async (c) => {
    const response = await listBreakingNews()
    return c.json(response)
  }),
)

app.get(
  '/mentions',
  handleErrors(async (c) => {
    const config = getConfig()
    const query = mentionQuerySchema(config.feedRetentionDays * HOURS_PER_DAY).parse(c.req.query())
    const response = await listMentions(query.q, query.windowHours)
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
