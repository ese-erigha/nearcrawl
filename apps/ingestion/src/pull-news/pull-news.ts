import { DbArticleRepository, DbCategoryRepository, type UpsertArticle } from 'db'

import { DAY_MS, getIngestionConfig } from '../config.ts'
import { warnSkippedArticle, warnUnknownMedtop } from '../sentry.ts'
import { listNewsPage, type NewsItem, type NewsTopic } from './apitube.client.ts'
import {
  addToCategoryFilingIndex,
  buildCategoryFilingIndex,
  resolveArticleCategories,
  type CategoryFilingIndex,
} from './resolve-article-categories.ts'

export type PullCounts = {
  pulled: number
  upserted: number
  skipped: number
  unknownTopics: number
}

type LocatedItem = NewsItem & { latitude: number; longitude: number }

type PageSplit = {
  skipped: NewsItem[]
  ready: LocatedItem[]
}

type PageCounts = {
  upserted: number
  skipped: number
  inWindow: number
  unknownTopics: number
}

/** Pull news pages until a page is empty, has no next page, is older than the feed window, or is already stored. */
export async function pullNews(): Promise<PullCounts> {
  const config = getIngestionConfig()
  const categoryRepository = new DbCategoryRepository(config.databaseUrl)
  const categories = await categoryRepository.listForFiling()
  const categoryIndex = buildCategoryFilingIndex(categories)
  const articleRepository = new DbArticleRepository(config.databaseUrl)
  const cutoff = Date.now() - config.retentionDays * DAY_MS
  const pullCounts: PullCounts = { pulled: 0, upserted: 0, skipped: 0, unknownTopics: 0 }
  let page = 1
  while (page <= config.maxPages) {
    const newsPage = await listNewsPage(page)
    const pageIds = newsPage.items.map((item) => item.apitubeId)
    const storedIds = await articleRepository.listExistingApitubeIds(pageIds)
    const pageCounts = await processBatch(newsPage.items, categoryIndex, categoryRepository, articleRepository, cutoff)
    pullCounts.pulled += newsPage.items.length + newsPage.dropped
    pullCounts.upserted += pageCounts.upserted
    pullCounts.skipped += newsPage.dropped + pageCounts.skipped
    pullCounts.unknownTopics += pageCounts.unknownTopics
    const pageWasEmpty = newsPage.items.length + newsPage.dropped === 0
    const pageWasOld = newsPage.items.length > 0 && pageCounts.inWindow === 0
    const pageWasKnown = pageIds.length > 0 && pageIds.every((id) => storedIds.includes(id))
    if (pageWasEmpty || !newsPage.hasNextPage || pageWasOld || pageWasKnown) {
      return pullCounts
    }
    page += 1
  }
  throw new Error(`APITube returned more than ${config.maxPages} pages`)
}

/** Split one page, insert missing categories, then write the articles in one batch. */
async function processBatch(
  items: readonly NewsItem[],
  categoryIndex: CategoryFilingIndex,
  categoryRepository: DbCategoryRepository,
  articleRepository: DbArticleRepository,
  cutoff: number,
): Promise<PageCounts> {
  const pageSplit = splitPage(items, cutoff)
  warnSkipped(pageSplit.skipped)
  const unknownTopics = await fileTopics(pageSplit.ready, categoryIndex, categoryRepository)
  const articlesToWrite = dedupeArticles(pageSplit.ready.map((item) => toUpsert(item, categoryIndex)))
  if (articlesToWrite.length > 0) {
    await articleRepository.upsertByApitubeIds(articlesToWrite)
  }
  return {
    upserted: articlesToWrite.length,
    skipped: pageSplit.skipped.length,
    inWindow: pageSplit.skipped.length + pageSplit.ready.length,
    unknownTopics,
  }
}

/** Drop items older than the cutoff. Skip items with bad coordinates. Keep the rest. */
function splitPage(items: readonly NewsItem[], cutoff: number): PageSplit {
  const skipped: NewsItem[] = []
  const ready: LocatedItem[] = []
  for (const item of items) {
    if (item.publishedAt.getTime() < cutoff) {
      continue
    }
    if (!hasCoordinates(item)) {
      skipped.push(item)
      continue
    }
    ready.push(item)
  }
  return { skipped, ready }
}

/** Log each article that the page skipped. */
function warnSkipped(items: readonly NewsItem[]): void {
  for (const item of items) {
    warnSkippedArticle(item.apitubeId, item.medtopIds)
  }
}

/** File each topic on the page. Count the topics that stay unknown. */
async function fileTopics(
  items: readonly NewsItem[],
  categoryIndex: CategoryFilingIndex,
  categoryRepository: DbCategoryRepository,
): Promise<number> {
  const unknownMedtopIds = new Set<string>()
  for (const item of items) {
    for (const topic of item.topics) {
      await fileTopic(topic, categoryIndex, categoryRepository, unknownMedtopIds)
    }
  }
  return unknownMedtopIds.size
}

/** File one topic into the index, or record it as unknown when the parent or the name is missing. */
async function fileTopic(
  topic: NewsTopic,
  categoryIndex: CategoryFilingIndex,
  categoryRepository: DbCategoryRepository,
  unknownMedtopIds: Set<string>,
): Promise<void> {
  if (categoryIndex.byMedtop.has(topic.medtopId) || unknownMedtopIds.has(topic.medtopId)) {
    return
  }
  const parent = topic.parentMedtopId ? categoryIndex.byMedtop.get(topic.parentMedtopId) : undefined
  if (!parent || !topic.name) {
    unknownMedtopIds.add(topic.medtopId)
    warnUnknownMedtop(topic.medtopId)
    return
  }
  const insertedCategory = await categoryRepository.insertByMedtop({
    name: topic.name,
    parentId: parent.id,
    medtopId: topic.medtopId,
  })
  addToCategoryFilingIndex(categoryIndex, insertedCategory)
}

/** Keep the later row when one apitube id appears twice on the page. */
function dedupeArticles(articles: readonly UpsertArticle[]): UpsertArticle[] {
  const articlesByApitubeId = new Map<string, UpsertArticle>()
  for (const article of articles) {
    articlesByApitubeId.set(article.apitubeId, article)
  }
  return [...articlesByApitubeId.values()]
}

/** Map one located item to the article row and its category chain. */
function toUpsert(item: LocatedItem, categoryIndex: CategoryFilingIndex): UpsertArticle {
  const filedCategories = resolveArticleCategories(categoryIndex, item.medtopIds)
  return {
    apitubeId: item.apitubeId,
    title: item.title,
    summary: item.summary,
    body: item.body,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    latitude: item.latitude,
    longitude: item.longitude,
    categoryId: filedCategories.categoryId,
    categoryIds: filedCategories.categoryIds,
    tags: item.tags,
    publishedAt: item.publishedAt,
    isBreaking: item.isBreaking,
    storyId: item.storyId,
  }
}

/** Return true when latitude and longitude are present and inside the globe bounds. */
function hasCoordinates(item: NewsItem): item is LocatedItem {
  return (
    item.latitude !== null &&
    item.longitude !== null &&
    item.latitude >= -90 &&
    item.latitude <= 90 &&
    item.longitude >= -180 &&
    item.longitude <= 180
  )
}
