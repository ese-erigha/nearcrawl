export class HttpError extends Error {
  readonly status: number
  readonly detail: string

  constructor(status: number, detail: string) {
    super(detail ? `HTTP ${status}: ${detail}` : `HTTP ${status}`)
    this.name = 'HttpError'
    this.status = status
    this.detail = detail
  }
}

export async function httpClient<T>(url: URL, headers: Record<string, string>): Promise<T> {
  const response = await fetch(url, { headers })
  if (!response.ok) {
    const detail = (await response.text()).trim()
    throw new HttpError(response.status, detail)
  }
  const body = (await response.json()) as T
  return body
}
