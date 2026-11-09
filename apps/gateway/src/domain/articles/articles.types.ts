import type { ArticleRow, BBox, BreakingNewsQuery, FiledTopic, HotNewsQuery, MentionNewsQuery, SpatialNewsQuery } from 'db'

export type { ArticleRow, BBox, BreakingNewsQuery, FiledTopic, HotNewsQuery, MentionNewsQuery, SpatialNewsQuery }

export interface ArticleRepository {
  findInBBox(query: SpatialNewsQuery): Promise<{ rows: ArticleRow[]; truncated: boolean }>
  findById(id: string): Promise<ArticleRow | null>
  listByCategory(categoryId: number, limit: number): Promise<ArticleRow[]>
  listHotByCountry(query: HotNewsQuery): Promise<ArticleRow[]>
  listBreaking(query: BreakingNewsQuery): Promise<ArticleRow[]>
  listMentions(query: MentionNewsQuery): Promise<ArticleRow[]>
}
