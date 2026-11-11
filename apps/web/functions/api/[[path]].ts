export async function onRequest(context: {
  request: Request
  env: { GATEWAY: { fetch(request: Request): Promise<Response> } }
}): Promise<Response> {
  return context.env.GATEWAY.fetch(context.request)
}
