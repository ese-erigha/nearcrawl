import { proxyInferenceStream } from '../../../lib/inference-stream.ts'

export async function explainArticle(articleId: string): Promise<Response> {
  const response = await proxyInferenceStream('/explanations', { articleId })
  return response
}
