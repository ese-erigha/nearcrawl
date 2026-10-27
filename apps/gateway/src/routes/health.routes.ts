import { Hono } from 'hono'

import type { ControllerContext } from '../types.ts'

const app = new Hono<ControllerContext>()

app.get('/', (c) => c.json({ status: 'ok' }))

export { app as healthRoutes }
