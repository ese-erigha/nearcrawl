import { proxyInferenceStream } from '../../../lib/inference-stream.ts'

export async function searchNews(query: string): Promise<Response> {
  const response = await proxyInferenceStream('/search', { query })
  return response
}
