export type CategorySummary = {
  id: number
  name: string
  medtopId: string | null
  childCount: number
}

export type CategoryNode = {
  id: number
  name: string
  medtopId: string | null
  parentId: number | null
}

export type CategoryDetail = {
  category: CategoryNode
  parent: Omit<CategoryNode, 'parentId'> | null
  children: CategorySummary[]
}

export interface CategoryRepository {
  listMenu(): Promise<CategorySummary[]>
  findWithChildren(id: number): Promise<CategoryDetail | null>
}
