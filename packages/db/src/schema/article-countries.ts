import { index, pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core'

import { articles } from './articles.ts'

export const articleCountries = pgTable(
  'article_countries',
  {
    articleId: uuid('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    countryCode: text('country_code').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.articleId, table.countryCode] }),
    index('article_countries_country_code_idx').on(table.countryCode),
  ],
)
