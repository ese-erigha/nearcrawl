import { Hono } from 'hono'

import { handleErrors } from '../../lib/errors.ts'
import type { ControllerContext } from '../../types.ts'
import { storyIdSchema } from './stories.schema.ts'
import { compareStory } from './usecases/compare-story.usecase.ts'

const app = new Hono<ControllerContext>()

app.post(
  '/:storyId/comparison',
  handleErrors(async (c) => {
    const storyId = storyIdSchema.parse(c.req.param('storyId'))
    return compareStory(storyId)
  }),
)

export default app
