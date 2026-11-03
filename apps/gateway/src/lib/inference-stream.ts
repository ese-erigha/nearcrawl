import { getConfig, getRequestId } from './context.ts'

const UNAVAILABLE = { error: 'Inference service is unavailable' }

export async function proxyInferenceStream(path: string, payload: unknown): Promise<Response> {
  const config = getConfig()
  const requestId = getRequestId() ?? crypto.randomUUID()
  const upstream = await fetchInference(config.inferenceUrl, config.inferenceSecret, path, payload, requestId)
  if (!upstream) {
    return Response.json(UNAVAILABLE, { status: 503 })
  }
  if (upstream.status === 200 && isEventStream(upstream.headers.get('content-type'))) {
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        'x-request-id': requestId,
      },
    })
  }
  if (upstream.status === 400 || upstream.status === 404) {
    const body = await upstream.text()
    return new Response(body, {
      status: upstream.status,
      headers: {
        'content-type': 'application/json',
        'x-request-id': requestId,
      },
    })
  }
  return Response.json(UNAVAILABLE, { status: 503 })
}

async function fetchInference(
  origin: string,
  secret: string,
  path: string,
  payload: unknown,
  requestId: string,
): Promise<Response | null> {
  try {
    return await fetch(new URL(path, origin), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${secret}`,
        'content-type': 'application/json',
        'x-request-id': requestId,
      },
      body: JSON.stringify(payload),
    })
  } catch {
    return null
  }
}

function isEventStream(header: string | null): boolean {
  const mediaType = header?.split(';')[0]?.trim().toLowerCase()
  return mediaType === 'text/event-stream'
}
