import type { CategoryDetail, CategoryNode, CategorySummary } from 'db'

export type { CategoryDetail, CategoryNode, CategorySummary }

export interface CategoryRepository {
  listMenu(): Promise<CategorySummary[]>
  findById(id: number): Promise<CategoryNode | null>
  findWithChildren(id: number): Promise<CategoryDetail | null>
}
