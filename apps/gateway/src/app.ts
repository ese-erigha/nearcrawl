import { sentry } from '@sentry/hono/cloudflare'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import { createConfig, readBindings } from './config.ts'
import articlesController from './domain/articles/articles.controller.ts'
import spatialNewsController from './domain/articles/spatial-news.controller.ts'
import categoriesController from './domain/categories/categories.controller.ts'
import { reportUnhappyStatus } from './lib/errors.ts'
import { sentryOptions } from './lib/sentry.ts'
import { healthRoutes } from './routes/health.routes.ts'
import type { ControllerContext } from './types.ts'

const app = new Hono<ControllerContext>()

app.use('*', sentry(app, sentryOptions))
app.use('*', contextStorage())

app.use('*', async (c, next) => {
  const bindings = readBindings(c.env)
  const requestId = crypto.randomUUID()
  c.set('requestId', requestId)
  c.header('x-request-id', requestId)
  c.set('config', createConfig(bindings))
  await next()
  reportUnhappyStatus(c)
})

app.route('/health', healthRoutes)
app.route('/api/categories', categoriesController)
app.route('/api/spatial/news', spatialNewsController)
app.route('/api/articles', articlesController)

export default app
