import { getCategoryRepository } from '../categories.repository.ts'
import type { CategorySummary } from '../categories.types.ts'

export async function listCategories(): Promise<{ categories: CategorySummary[] }> {
  const repository = getCategoryRepository()
  const categories = await repository.listMenu()
  return { categories }
}
