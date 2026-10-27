import { categoryCatalog, categoryMenu } from './categories.catalog.ts'

const byId = new Map(categoryCatalog.map((row) => [row.id, row]))
const menuIndex = new Map<number, number>(categoryMenu.map((id, index) => [id, index]))

export function sortFiledCategories<T extends { id: number; name: string }>(nodes: readonly T[]): T[] {
  return [...nodes].sort((left, right) => {
    const byMenu = menuRank(left.id) - menuRank(right.id)
    if (byMenu !== 0) {
      return byMenu
    }
    const byDepth = depth(left.id) - depth(right.id)
    if (byDepth !== 0) {
      return byDepth
    }
    return left.name.localeCompare(right.name)
  })
}

function rootOf(id: number): number {
  let current = byId.get(id)
  const seen = new Set<number>()
  while (current?.parentId && !seen.has(current.id)) {
    seen.add(current.id)
    const parent = byId.get(current.parentId)
    if (!parent) {
      break
    }
    current = parent
  }
  return current?.id ?? id
}

function depth(id: number): number {
  let count = 0
  let current = byId.get(id)
  const seen = new Set<number>()
  while (current?.parentId && !seen.has(current.id)) {
    seen.add(current.id)
    const parent = byId.get(current.parentId)
    if (!parent) {
      break
    }
    count += 1
    current = parent
  }
  return count
}

function menuRank(id: number): number {
  return menuIndex.get(rootOf(id)) ?? menuIndex.size
}
