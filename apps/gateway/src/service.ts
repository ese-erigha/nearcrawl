export const service = {
  name: 'gateway',
  routes: {
    categories: '/api/categories',
    spatialNews: '/api/spatial/news',
    article: '/api/articles/:id',
  },
} as const

export function spatialNewsPath(bbox: string): string {
  const params = new URLSearchParams({ bbox })
  return `${service.routes.spatialNews}?${params.toString()}`
}
