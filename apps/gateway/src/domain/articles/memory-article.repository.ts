import { CATEGORY } from 'db'

import type { ArticleRepository, ArticleRow, SpatialNewsQuery } from './articles.types.ts'

const FIXTURE: ArticleRow[] = [
  {
    id: '6b1c0c3e-1f4a-4a0e-9c1d-2a6f0b9e8d11',
    title: 'Port closure',
    summary: 'Shipping halted overnight.',
    body: 'The port stopped night traffic after the channel was closed.',
    source_name: 'Harbor Desk',
    source_url: 'https://example.com/port',
    latitude: 1.3,
    longitude: 103.8,
    category_id: CATEGORY.POLITICS,
    filed: [{ id: CATEGORY.POLITICS, name: 'Politics' }],
    tags: ['shipping'],
    published_at: new Date('2026-10-26T12:00:00.000Z'),
    is_breaking: false,
  },
]

export class MemoryArticleRepository implements ArticleRepository {
  private readonly rows: ArticleRow[]

  constructor(rows: ArticleRow[] = FIXTURE) {
    this.rows = rows
  }

  findInBBox(query: SpatialNewsQuery): Promise<{ rows: ArticleRow[]; truncated: boolean }> {
    const matches = this.rows.filter((row) => inBox(row, query)).sort(newestFirst)
    const cap = query.limit
    const page = matches.slice(0, cap + 1)
    const truncated = page.length > cap
    const rows = truncated ? page.slice(0, cap) : page
    return Promise.resolve({ rows, truncated })
  }

  findById(id: string): Promise<ArticleRow | null> {
    const row = this.rows.find((candidate) => candidate.id === id) ?? null
    return Promise.resolve(row)
  }

  listByCategory(categoryId: number, limit: number): Promise<ArticleRow[]> {
    const matches = this.rows.filter((row) => filedAs(row, categoryId)).sort(newestFirst)
    return Promise.resolve(matches.slice(0, limit))
  }
}

function inBox(row: ArticleRow, query: SpatialNewsQuery): boolean {
  const { west, south, east, north } = query.bbox
  if (row.latitude < south || row.latitude > north) {
    return false
  }
  if (query.categoryId !== undefined && !filedAs(row, query.categoryId)) {
    return false
  }
  if (west <= east) {
    return row.longitude >= west && row.longitude <= east
  }
  return row.longitude >= west || row.longitude <= east
}

function filedAs(row: ArticleRow, categoryId: number): boolean {
  return row.filed.some((topic) => topic.id === categoryId)
}

function newestFirst(left: ArticleRow, right: ArticleRow): number {
  const byTime = right.published_at.getTime() - left.published_at.getTime()
  if (byTime !== 0) {
    return byTime
  }
  if (left.id === right.id) {
    return 0
  }
  return left.id < right.id ? 1 : -1
}
