import { getConfig, getRequestId } from './context.ts'

export async function postInferenceJson(path: string, payload: unknown): Promise<unknown | null> {
  const config = getConfig()
  console.log('inference url', config.inferenceUrl)
  if (config.inferenceUrl === '') return null
  const requestId = getRequestId() ?? crypto.randomUUID()
  try {
    const response = await fetch(new URL(path, config.inferenceUrl), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.inferenceSecret}`,
        'content-type': 'application/json',
        'x-request-id': requestId,
      },
      body: JSON.stringify(payload),
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}
