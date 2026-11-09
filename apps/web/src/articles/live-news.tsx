import { useEffect, useState, type ReactNode } from 'react'

import { readVisitorPlace, type VisitorPlace } from '../map/visitor-place.ts'
import type { Article } from './article.ts'
import { listBreakingNews } from './news-api.ts'
import { LiveNewsContext } from './use-live-news.ts'

export function LiveNewsProvider({ children }: { children: ReactNode }) {
  const [place, setPlace] = useState<VisitorPlace | null>(null)
  const [placeReady, setPlaceReady] = useState(false)
  const [breaking, setBreaking] = useState<Article[]>([])
  const [breakingReady, setBreakingReady] = useState(false)
  const [breakingError, setBreakingError] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const next = await readVisitorPlace()
      if (cancelled) return
      setPlace(next)
      setPlaceReady(true)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const stories = await listBreakingNews()
        if (cancelled) return
        setBreaking(stories)
        setBreakingReady(true)
      } catch {
        if (cancelled) return
        setBreakingError(true)
        setBreakingReady(true)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <LiveNewsContext.Provider value={{ place, placeReady, breaking, breakingReady, breakingError }}>{children}</LiveNewsContext.Provider>
  )
}

