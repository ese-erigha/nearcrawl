import { useEffect, useState } from 'react'

import { useLiveNews } from '../articles/use-live-news.ts'
import { listHotNews, listPreferenceStories } from '../articles/news-api.ts'
import { BriefCrumbs, BriefHeader } from '../brief/brief-header.tsx'
import { BriefDotMap } from '../brief/brief-dot-map.tsx'
import { BriefGroup } from '../brief/brief-group.tsx'
import { BriefMetricCard } from '../brief/brief-metric-card.tsx'
import { BRIEF_WINDOW_HOURS, buildCountryBrief, buildUserBrief, storiesInBrief, type BriefView } from '../brief/brief-model.ts'
import { BriefRail } from '../brief/brief-rail.tsx'
import { SAVED_PREFERENCES } from '../brief/saved-preferences.ts'
import { PATH } from '../shell/navigation.constants.ts'

const PUBLIC_CRUMBS = [
  { label: 'Live map', href: PATH.MAP },
  { label: 'Daily brief' },
]

const USER_CRUMBS = [
  { label: 'Live map', href: PATH.MAP },
  { label: 'Daily brief', href: PATH.BRIEF },
  { label: 'Your brief' },
]

export function DailyBriefScreen() {
  const { place, placeReady, breaking, breakingReady, breakingError } = useLiveNews()
  const [brief, setBrief] = useState<BriefView | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!placeReady) return
    if (!place && !breakingReady) return
    if (!place && breakingError) return
    let cancelled = false
    const load = async () => {
      const stories = place ? await listHotNews(place.code, BRIEF_WINDOW_HOURS) : storiesInBrief(breaking)
      if (cancelled) return
      setBrief(buildCountryBrief(stories, place?.name ?? null))
      setFailed(false)
    }
    void load().catch(() => {
      if (!cancelled) setFailed(true)
    })
    return () => {
      cancelled = true
    }
  }, [place, placeReady, breaking, breakingReady, breakingError])

  if (failed || (placeReady && !place && breakingError)) return <BriefStatus text="The brief did not load." />
  if (!brief) return <BriefStatus text="Loading the brief." />
  return <BriefDocument brief={brief} crumbs={PUBLIC_CRUMBS} />
}

export function UserBriefScreen() {
  const [brief, setBrief] = useState<BriefView | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const stories = await listPreferenceStories(SAVED_PREFERENCES)
      if (cancelled) return
      setBrief(buildUserBrief(stories, SAVED_PREFERENCES))
    }
    void load().catch(() => {
      if (!cancelled) setFailed(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (failed) return <BriefStatus text="The brief did not load." />
  if (!brief) return <BriefStatus text="Loading the brief." />
  return <BriefDocument brief={brief} crumbs={USER_CRUMBS} />
}

function BriefStatus({ text }: { text: string }) {
  return <p className="px-7 pt-16 text-[15px] text-ink-3">{text}</p>
}

function BriefDocument({ brief, crumbs }: { brief: BriefView; crumbs: { label: string; href?: string }[] }) {
  const pins = brief.groups.flatMap((group) =>
    group.items.map((item) => ({
      latitude: item.story.latitude,
      longitude: item.story.longitude,
      isBreaking: item.story.isBreaking,
    })),
  )

  return (
    <div className="absolute inset-0 overflow-auto">
      <div className="mx-auto w-full max-w-[1200px] px-5 pt-2 pb-24 sm:px-7">
        <BriefCrumbs items={crumbs} />
        <div className="mt-6 grid gap-x-12 lg:grid-cols-[minmax(0,1fr)_340px]">
          <BriefHeader brief={brief} />
          <BriefMetricCard brief={brief} />
          <BriefDotMap pins={pins} storyCount={brief.storyCount} />
          <div id="brief-stories" className="min-w-0 lg:col-start-1 lg:row-start-3">
            {brief.groups.map((group) => (
              <BriefGroup key={group.id} group={group} />
            ))}
          </div>
          <BriefRail brief={brief} />
        </div>
      </div>
    </div>
  )
}
