import { createContext, useContext } from 'react'

import type { VisitorPlace } from '../map/visitor-place.ts'
import type { Article } from './article.ts'

export type LiveNews = {
  place: VisitorPlace | null
  placeReady: boolean
  breaking: Article[]
  breakingReady: boolean
  breakingError: boolean
}

export const LiveNewsContext = createContext<LiveNews | null>(null)

export function useLiveNews() {
  const news = useContext(LiveNewsContext)
  if (!news) throw new Error('Live news is not ready')
  return news
}
