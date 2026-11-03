import { proxyInferenceStream } from '../../../lib/inference-stream.ts'

export async function compareStory(storyId: string): Promise<Response> {
  const response = await proxyInferenceStream('/comparisons', { storyId })
  return response
}
