import { integer, pgTable, text, unique, type AnyPgColumn } from 'drizzle-orm/pg-core'

export const categories = pgTable(
  'categories',
  {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    name: text('name').notNull(),
    parentId: integer('parent_id').references((): AnyPgColumn => categories.id),
    medtopId: text('medtop_id'),
  },
  (table) => [unique('categories_medtop_id_key').on(table.medtopId)],
)
