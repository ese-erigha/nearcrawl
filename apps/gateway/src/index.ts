import { serve } from '@hono/node-server'

import app from './app.ts'
import { initSentry } from './lib/sentry.ts'
import { service } from './service.ts'

initSentry()

const port = Number(process.env.PORT ?? 8787)

serve(
  {
    fetch: (request) => app.fetch(request, process.env),
    port,
  },
  () => {
    console.log(`${service.name} listening on ${port}`)
  },
)
