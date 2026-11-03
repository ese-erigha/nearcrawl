import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  customType,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { categories } from './categories.ts'

const geographyPoint = customType<{ data: string }>({
  dataType() {
    return 'geography(Point, 4326)'
  },
})

const searchVector = customType<{ data: string }>({
  dataType() {
    return 'tsvector'
  },
})

export const articles = pgTable(
  'articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    apitubeId: text('apitube_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    body: text('body').notNull(),
    bodyHtml: text('body_html'),
    imageUrl: text('image_url'),
    faviconUrl: text('favicon_url'),
    authorName: text('author_name'),
    sourceName: text('source_name').notNull(),
    sourceUrl: text('source_url').notNull(),
    sourceHomeUrl: text('source_home_url'),
    sourceCountryName: text('source_country_name'),
    sourceCountryCode: text('source_country_code'),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    location: geographyPoint('location').generatedAlwaysAs(
      sql`ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography`,
    ),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
    isBreaking: boolean('is_breaking').notNull().default(false),
    isFree: boolean('is_free'),
    isDuplicate: boolean('is_duplicate').notNull().default(false),
    shareCount: integer('share_count').notNull().default(0),
    readTimeMinutes: integer('read_time_minutes'),
    wordsCount: integer('words_count'),
    sourceRank: integer('source_rank'),
    storyId: text('story_id'),
    searchVector: searchVector('search_vector').generatedAlwaysAs(
      sql`to_tsvector('english'::regconfig, coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(immutable_array_to_string(tags, ' '), ''))`,
    ),
    ingestedAt: timestamp('ingested_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('articles_apitube_id_key').on(table.apitubeId),
    index('articles_location_gix').using('gist', table.location),
    index('articles_search_vector_idx').using('gin', table.searchVector),
    index('articles_lat_lng_idx').on(table.latitude, table.longitude),
    index('articles_published_at_idx').on(table.publishedAt),
    index('articles_category_published_at_idx').on(table.categoryId, table.publishedAt.desc()),
    check('articles_latitude_check', sql`${table.latitude} BETWEEN -90 AND 90`),
    check('articles_longitude_check', sql`${table.longitude} BETWEEN -180 AND 180`),
  ],
)
