import { index, integer, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'

import { articles } from './articles.ts'
import { categories } from './categories.ts'

export const articleCategories = pgTable(
  'article_categories',
  {
    articleId: uuid('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
  },
  (table) => [
    primaryKey({ columns: [table.articleId, table.categoryId] }),
    index('article_categories_category_id_idx').on(table.categoryId),
  ],
)
