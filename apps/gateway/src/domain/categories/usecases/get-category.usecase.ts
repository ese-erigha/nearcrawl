import { NotFoundError } from '../../../lib/errors.ts'
import { getCategoryRepository } from '../categories.repository.ts'
import type { CategoryDetail } from '../categories.types.ts'

export async function getCategory(id: number): Promise<CategoryDetail> {
  const repository = getCategoryRepository()
  const detail = await repository.findWithChildren(id)
  if (!detail) {
    throw new NotFoundError('Category not found')
  }
  return detail
}
