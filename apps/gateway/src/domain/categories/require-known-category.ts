import { ValidationError } from '../../lib/errors.ts'
import { getCategoryRepository } from './categories.repository.ts'

export async function requireKnownCategory(categoryId: number | undefined): Promise<void> {
  if (categoryId === undefined) {
    return
  }
  const category = await getCategoryRepository().findById(categoryId)
  if (!category) {
    throw new ValidationError('Unknown category')
  }
}
