import type { ArticleRow, BBox, FiledTopic, HotNewsQuery, SpatialNewsQuery } from 'db'

export type { ArticleRow, BBox, FiledTopic, HotNewsQuery, SpatialNewsQuery }

export interface ArticleRepository {
  findInBBox(query: SpatialNewsQuery): Promise<{ rows: ArticleRow[]; truncated: boolean }>
  findById(id: string): Promise<ArticleRow | null>
  listByCategory(categoryId: number, limit: number): Promise<ArticleRow[]>
  listHotByCountry(query: HotNewsQuery): Promise<ArticleRow[]>
}
