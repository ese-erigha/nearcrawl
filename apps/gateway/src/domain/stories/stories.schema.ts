import { z } from 'zod'

export const storyIdSchema = z
  .string()
  .trim()
  .min(1, { error: 'storyId is required' })
  .refine((value) => !z.uuid().safeParse(value).success, { error: 'storyId must not be a uuid' })
