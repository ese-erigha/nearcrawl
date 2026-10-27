export type BBox = {
  west: number
  south: number
  east: number
  north: number
}

export type SpatialNewsQuery = {
  bbox: BBox
  categoryId?: number
  limit: number
}

export type FiledTopic = {
  id: number
  name: string
}

export type ArticleRow = {
  id: string
  title: string
  summary: string
  body: string
  source_name: string
  source_url: string
  latitude: number
  longitude: number
  category_id: number
  filed: FiledTopic[]
  tags: string[]
  published_at: Date
  is_breaking: boolean
}

export interface ArticleRepository {
  findInBBox(query: SpatialNewsQuery): Promise<{ rows: ArticleRow[]; truncated: boolean }>
  findById(id: string): Promise<ArticleRow | null>
  listByCategory(categoryId: number, limit: number): Promise<ArticleRow[]>
}
