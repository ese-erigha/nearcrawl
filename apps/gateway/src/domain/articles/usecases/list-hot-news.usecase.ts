import { getConfig } from '../../../lib/context.ts'
import { mapArticle, type Article } from '../articles.mappers.ts'
import { getArticleRepository } from '../articles.repository.ts'
import { publishedAfter } from '../news-window.ts'

export async function listHotNews(countries: readonly string[], windowHours?: number): Promise<{ articles: Article[] }> {
  const config = getConfig()
  const repository = getArticleRepository()
  const after = publishedAfter(config.feedRetentionDays, windowHours)
  const codes = uniqueCodes(countries)
  const rows = await repository.listHotByCountry({
    countryCodes: codes,
    publishedAfter: after,
    limit: config.hotNewsCap,
  })
  return { articles: shareHotNews(rows.map(mapArticle), codes, config.hotNewsCap) }
}

function uniqueCodes(countries: readonly string[]): string[] {
  return [...new Set(countries)]
}

function shareHotNews(articles: Article[], countries: readonly string[], cap: number): Article[] {
  const unique = uniqueArticles(articles)
  const share = Math.floor(cap / countries.length)
  const picked = new Map<string, Article>()
  for (const code of countries) {
    takeShare(storiesFor(unique, code), share, picked)
  }
  const leftovers = unique.filter((article) => !picked.has(article.id)).sort(hotterFirst)
  for (const article of leftovers) {
    if (picked.size >= cap) break
    picked.set(article.id, article)
  }
  return [...picked.values()].sort(hotterFirst).slice(0, cap)
}

function uniqueArticles(articles: Article[]): Article[] {
  const byId = new Map<string, Article>()
  for (const article of articles) {
    if (!byId.has(article.id)) byId.set(article.id, article)
  }
  return [...byId.values()]
}

function storiesFor(articles: Article[], code: string): Article[] {
  return articles.filter((article) => article.countryCodes.includes(code)).sort(hotterFirst)
}

function takeShare(stories: Article[], share: number, picked: Map<string, Article>) {
  let added = 0
  for (const story of stories) {
    if (added >= share) return
    if (picked.has(story.id)) continue
    picked.set(story.id, story)
    added += 1
  }
}

function hotterFirst(left: Article, right: Article): number {
  if (left.isBreaking !== right.isBreaking) return left.isBreaking ? -1 : 1
  if (left.shareCount !== right.shareCount) return right.shareCount - left.shareCount
  return Date.parse(right.publishedAt) - Date.parse(left.publishedAt)
}
