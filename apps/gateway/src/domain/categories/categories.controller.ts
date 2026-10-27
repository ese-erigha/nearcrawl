import { Hono } from 'hono'

import { getConfig } from '../../lib/context.ts'
import { handleErrors } from '../../lib/errors.ts'
import type { ControllerContext } from '../../types.ts'
import { categoryArticlesQuerySchema, categoryPathSchema } from './categories.validation.ts'
import { getCategory } from './usecases/get-category.usecase.ts'
import { listCategories } from './usecases/list-categories.usecase.ts'
import { listCategoryArticles } from './usecases/list-category-articles.usecase.ts'

const app = new Hono<ControllerContext>()

app.get(
  '/',
  handleErrors(async (c) => {
    const response = await listCategories()
    return c.json(response)
  }),
)

app.get(
  '/:id/articles',
  handleErrors(async (c) => {
    const id = categoryPathSchema.parse(c.req.param('id'))
    const config = getConfig()
    const query = categoryArticlesQuerySchema({
      cap: config.categoryArticlesCap,
      defaultLimit: config.categoryArticlesDefault,
    }).parse(c.req.query())
    const response = await listCategoryArticles(id, query.limit)
    return c.json(response)
  }),
)

app.get(
  '/:id',
  handleErrors(async (c) => {
    const id = categoryPathSchema.parse(c.req.param('id'))
    const category = await getCategory(id)
    return c.json(category)
  }),
)

export default app
