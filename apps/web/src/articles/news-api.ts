import { BRIEF_WINDOW_HOURS } from '../brief/brief-model.ts'
import type { Article } from './article.ts'

export type NewsBox = {
  west: number
  south: number
  east: number
  north: number
}

export const WORLD_BOX: NewsBox = { west: -180, south: -90, east: 180, north: 90 }

type ArticleList = { articles: Article[] }

type PreferenceQuery = {
  homeCountryCodes: readonly string[]
  trackedNames: readonly string[]
}

export async function listDailyBrief(country: string): Promise<{ articles: Article[]; summary: string }> {
  const params = new URLSearchParams({ country })
  const response = await fetch(`/api/briefs?${params}`)
  if (!response.ok) throw new Error('The brief did not load.')
  const body = (await response.json()) as { articles: Article[]; summary: string }
  return { articles: body.articles, summary: body.summary }
}

export async function listHotNews(country: string, windowHours?: number): Promise<Article[]> {
  const params = new URLSearchParams({ country })
  if (windowHours !== undefined) params.set('windowHours', String(windowHours))
  return readArticles(`/api/articles?${params}`)
}

export async function listBreakingNews(): Promise<Article[]> {
  return readArticles('/api/articles/breaking')
}

export async function listMentions(text: string, windowHours?: number): Promise<Article[]> {
  const params = new URLSearchParams({ q: text })
  if (windowHours !== undefined) params.set('windowHours', String(windowHours))
  return readArticles(`/api/articles/mentions?${params}`)
}

export async function listSpatialNews(box: NewsBox): Promise<Article[]> {
  const bbox = [box.west, box.south, box.east, box.north].map((value) => value.toFixed(4)).join(',')
  const response = await fetch(`/api/spatial/news?bbox=${bbox}`)
  if (!response.ok) throw new Error('The map stories did not load.')
  const body = (await response.json()) as ArticleList
  return body.articles
}

export async function listPreferenceStories(preferences: PreferenceQuery): Promise<Article[]> {
  const countryLoads = preferences.homeCountryCodes.map((code) => listHotNews(code, BRIEF_WINDOW_HOURS))
  const nameLoads = preferences.trackedNames
    .map((name) => name.trim())
    .filter((name) => name.length >= 2)
    .map((name) => listMentions(name, BRIEF_WINDOW_HOURS))
  const results = await Promise.allSettled([...countryLoads, ...nameLoads])
  const failed = results.length > 0 && results.every((result) => result.status === 'rejected')
  if (failed) throw new Error('The story list did not load.')
  const stories = results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
  return uniqueArticles(stories)
}

async function readArticles(path: string): Promise<Article[]> {
  const response = await fetch(path)
  if (!response.ok) throw new Error('The story list did not load.')
  const body = (await response.json()) as ArticleList
  return body.articles
}

function uniqueArticles(stories: Article[]): Article[] {
  const seen = new Set<string>()
  const unique: Article[] = []
  for (const story of stories) {
    if (seen.has(story.id)) continue
    seen.add(story.id)
    unique.push(story)
  }
  return unique
}
