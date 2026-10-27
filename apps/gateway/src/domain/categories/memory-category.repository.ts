import { categoryCatalog, categoryMenu, type CategoryRecord } from 'db'

import type { CategoryDetail, CategoryRepository, CategorySummary } from './categories.types.ts'

const byId = new Map(categoryCatalog.map((row) => [row.id, row]))
const childrenByParent = new Map<number, CategoryRecord[]>()

for (const row of categoryCatalog) {
  if (row.parentId === null) {
    continue
  }
  const siblings = childrenByParent.get(row.parentId)
  if (siblings) {
    siblings.push(row)
  } else {
    childrenByParent.set(row.parentId, [row])
  }
}

for (const [parentId, siblings] of childrenByParent) {
  childrenByParent.set(
    parentId,
    [...siblings].sort((left, right) => left.name.localeCompare(right.name)),
  )
}

function summary(id: number): CategorySummary | null {
  const row = byId.get(id)
  if (!row) {
    return null
  }
  return {
    id: row.id,
    name: row.name,
    medtopId: row.medtopId,
    childCount: childrenByParent.get(row.id)?.length ?? 0,
  }
}

export class MemoryCategoryRepository implements CategoryRepository {
  listMenu(): Promise<CategorySummary[]> {
    const categories = categoryMenu.flatMap((id) => {
      const row = summary(id)
      return row ? [row] : []
    })
    return Promise.resolve(categories)
  }

  findWithChildren(id: number): Promise<CategoryDetail | null> {
    const row = byId.get(id)
    if (!row) {
      return Promise.resolve(null)
    }
    const parent = row.parentId === null ? undefined : byId.get(row.parentId)
    const children = (childrenByParent.get(row.id) ?? []).flatMap((child) => {
      const item = summary(child.id)
      return item ? [item] : []
    })
    return Promise.resolve({
      category: {
        id: row.id,
        name: row.name,
        medtopId: row.medtopId,
        parentId: row.parentId,
      },
      parent: parent
        ? { id: parent.id, name: parent.name, medtopId: parent.medtopId }
        : null,
      children,
    })
  }
}
