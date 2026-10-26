import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  customType,
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

const geographyPoint = customType<{ data: string }>({
  dataType() {
    return 'geography(Point, 4326)'
  },
})

export const articleCategories = ['Finance', 'Tech', 'Geopolitics', 'General'] as const

export type ArticleCategory = (typeof articleCategories)[number]

export const articles = pgTable(
  'articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    apitubeId: text('apitube_id').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    body: text('body').notNull(),
    sourceName: text('source_name').notNull(),
    sourceUrl: text('source_url').notNull(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    location: geographyPoint('location').generatedAlwaysAs(
      sql`ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography`,
    ),
    category: text('category').notNull().$type<ArticleCategory>(),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
    isBreaking: boolean('is_breaking').notNull().default(false),
    storyId: text('story_id'),
    ingestedAt: timestamp('ingested_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('articles_apitube_id_key').on(table.apitubeId),
    index('articles_location_gix').using('gist', table.location),
    index('articles_lat_lng_idx').on(table.latitude, table.longitude),
    index('articles_published_at_idx').on(table.publishedAt),
    index('articles_category_published_at_idx').on(table.category, table.publishedAt.desc()),
    check('articles_latitude_check', sql`${table.latitude} BETWEEN -90 AND 90`),
    check('articles_longitude_check', sql`${table.longitude} BETWEEN -180 AND 180`),
    check(
      'articles_category_check',
      sql`${table.category} IN ('Finance', 'Tech', 'Geopolitics', 'General')`,
    ),
  ],
)
