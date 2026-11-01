export type FilingCategory = {
  id: number
  parentId: number | null
  medtopId: string | null
}

export type CategoryFilingIndex = {
  generalId: number
  byMedtop: Map<string, FilingCategory>
  chainById: Map<number, readonly number[]>
}

export type FiledCategoryScore = {
  categoryId: number
  score: number | null
}

export type ResolvedCategories = {
  categoryId: number
  categoryIds: number[]
  filedCategories: FiledCategoryScore[]
  unknownTopics: number
}

export function buildCategoryFilingIndex(categories: readonly FilingCategory[]): CategoryFilingIndex {
  const general = rootWithoutMedtop(categories)
  const byId = new Map(categories.map((category) => [category.id, category]))
  const byMedtop = new Map<string, FilingCategory>()
  const chainById = new Map<number, readonly number[]>()
  for (const category of categories) {
    if (category.medtopId) {
      byMedtop.set(category.medtopId, category)
    }
    ancestorChain(category, byId, chainById, new Set())
  }
  return { generalId: general.id, byMedtop, chainById }
}

export function addToCategoryFilingIndex(categoryIndex: CategoryFilingIndex, category: FilingCategory): void {
  const parentChain = category.parentId === null ? [] : categoryIndex.chainById.get(category.parentId)
  if (category.parentId !== null && !parentChain) {
    throw new Error(`category ${category.id} is missing parent ${category.parentId}`)
  }
  if (category.medtopId) {
    categoryIndex.byMedtop.set(category.medtopId, category)
  }
  categoryIndex.chainById.set(category.id, [category.id, ...(parentChain ?? [])])
}

export function resolveArticleCategories(
  categoryIndex: CategoryFilingIndex,
  medtopIds: readonly string[],
  scores: ReadonlyMap<string, number | null> = new Map(),
): ResolvedCategories {
  const matchedIds: number[] = []
  const seen = new Set<number>()
  const unknown = new Set<string>()
  const scoreById = new Map<number, number | null>()
  for (const medtopId of medtopIds) {
    const category = categoryIndex.byMedtop.get(medtopId)
    if (!category) {
      unknown.add(medtopId)
      continue
    }
    const chain = categoryIndex.chainById.get(category.id)
    if (!chain) {
      throw new Error(`category ${category.id} has no ancestor chain`)
    }
    const score = scores.get(medtopId) ?? null
    for (const ancestorId of chain) {
      scoreById.set(ancestorId, higherScore(scoreById.get(ancestorId), score))
    }
    if (seen.has(category.id)) {
      continue
    }
    seen.add(category.id)
    matchedIds.push(category.id)
  }
  if (matchedIds.length === 0) {
    return {
      categoryId: categoryIndex.generalId,
      categoryIds: [categoryIndex.generalId],
      filedCategories: [{ categoryId: categoryIndex.generalId, score: null }],
      unknownTopics: unknown.size,
    }
  }
  const categoryIds = new Set<number>()
  const roots: number[] = []
  for (const id of matchedIds) {
    const chain = categoryIndex.chainById.get(id)
    if (!chain) {
      throw new Error(`category ${id} has no ancestor chain`)
    }
    for (const ancestorId of chain) {
      categoryIds.add(ancestorId)
    }
    const root = chain[chain.length - 1]
    if (root !== undefined) {
      roots.push(root)
    }
  }
  const ids = [...categoryIds]
  return {
    categoryId: Math.min(...roots),
    categoryIds: ids,
    filedCategories: ids.map((categoryId) => ({ categoryId, score: scoreById.get(categoryId) ?? null })),
    unknownTopics: unknown.size,
  }
}

function higherScore(current: number | null | undefined, next: number | null): number | null {
  if (current === undefined || current === null) {
    return next
  }
  if (next === null) {
    return current
  }
  return Math.max(current, next)
}

function rootWithoutMedtop(categories: readonly FilingCategory[]): FilingCategory {
  const roots = categories.filter((category) => category.parentId === null && category.medtopId === null)
  const root = roots[0]
  if (roots.length !== 1 || !root) {
    throw new Error('categories must include one root with no medtop id')
  }
  return root
}

function ancestorChain(
  category: FilingCategory,
  byId: ReadonlyMap<number, FilingCategory>,
  chainById: Map<number, readonly number[]>,
  stack: Set<number>,
): readonly number[] {
  const cached = chainById.get(category.id)
  if (cached) {
    return cached
  }
  if (stack.has(category.id)) {
    throw new Error(`category ${category.id} has a parent cycle`)
  }
  stack.add(category.id)
  const chain = chainThroughParent(category, byId, chainById, stack)
  stack.delete(category.id)
  chainById.set(category.id, chain)
  return chain
}

function chainThroughParent(
  category: FilingCategory,
  byId: ReadonlyMap<number, FilingCategory>,
  chainById: Map<number, readonly number[]>,
  stack: Set<number>,
): readonly number[] {
  if (category.parentId === null) {
    return [category.id]
  }
  const parent = byId.get(category.parentId)
  if (!parent) {
    throw new Error(`category ${category.id} is missing parent ${category.parentId}`)
  }
  return [category.id, ...ancestorChain(parent, byId, chainById, stack)]
}
