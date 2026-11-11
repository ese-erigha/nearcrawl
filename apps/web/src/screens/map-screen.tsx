import { useEffect, useMemo, useState } from 'react'

import type { Article } from '../articles/article.ts'
import { regionName } from '../articles/article.ts'
import { useLiveNews } from '../articles/use-live-news.ts'
import { listHotNews, listSpatialNews, WORLD_BOX, type NewsBox } from '../articles/news-api.ts'
import { BreakingDock } from '../map/breaking-dock.tsx'
import { countryFocus } from '../map/country-frame.ts'
import { COUNTRY_PICK_CAP } from '../map/country-choices.ts'
import { GlobeCanvas } from '../map/globe-canvas.tsx'
import { DETAIL_MAP_INSET } from '../map/globe-math.ts'
import { HOT_PANEL_INSET, HotPanel } from '../map/hot-panel.tsx'
import { StoryPanel } from '../map/story-panel.tsx'

const NO_COUNTRIES: string[] = []

type ListStatus = 'loading' | 'ready' | 'error'

export function MapScreen() {
  const { place, placeReady, breaking } = useLiveNews()
  const [panelOpen, setPanelOpen] = useState(true)
  const [countries, setCountries] = useState<string[] | null>(null)
  const [hot, setHot] = useState<Article[]>([])
  const [hotStatus, setHotStatus] = useState<ListStatus>('loading')
  if (placeReady && countries === null) {
    setCountries(place ? [place.code] : [])
  }
  const selectedCodes = countries ?? NO_COUNTRIES
  const [pins, setPins] = useState<Article[]>([])
  const [selected, setSelected] = useState<Article | null>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const target = event.target
      if (target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const stories = await listSpatialNews(WORLD_BOX)
      if (cancelled) return
      setPins(stories)
    }
    void load().catch(() => {
      if (!cancelled) setPins([])
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (selectedCodes.length === 0) return
    let cancelled = false
    const load = async () => {
      setHotStatus('loading')
      const stories = await listHotNews(selectedCodes)
      if (cancelled) return
      setHot(stories)
      setHotStatus('ready')
    }
    void load().catch(() => {
      if (!cancelled) setHotStatus('error')
    })
    return () => {
      cancelled = true
    }
  }, [selectedCodes])

  const selectedCountries = selectedCodes.map((code) => ({ code, name: regionName(code) }))
  const hasCountry = selectedCodes.length > 0
  const list = hasCountry ? hot : breaking
  const title = !placeReady ? 'Finding your country' : hasCountry ? 'Hot in' : 'Breaking worldwide'
  const subtitle = countrySubtitle(placeReady, selectedCountries)
  const status: ListStatus = !placeReady ? 'loading' : hasCountry ? hotStatus : 'ready'
  const known = [...list, ...pins, ...breaking]
  const home = useMemo(() => countryFocus(selectedCodes), [selectedCodes])

  const selectStory = (id: string) => {
    const story = known.find((item) => item.id === id) ?? null
    setSelected(story)
  }

  const onSettle = (box: NewsBox) => {
    void listSpatialNews(box)
      .then((stories) => setPins(stories))
      .catch((error: unknown) => {
        console.error(error)
      })
  }

  return (
    <div className="absolute inset-0">
      <GlobeCanvas
        stories={pins}
        insetLeft={panelOpen ? HOT_PANEL_INSET : 16}
        insetRight={selected ? DETAIL_MAP_INSET : 0}
        insetBottom={196}
        selectedId={selected?.id ?? null}
        home={home}
        onSelect={(id) => (id ? selectStory(id) : setSelected(null))}
        onSettle={onSettle}
      />
      {panelOpen ? (
        <HotPanel
          title={title}
          subtitle={subtitle}
          stories={list}
          status={status}
          onClose={() => setPanelOpen(false)}
          selectedId={selected?.id ?? null}
          onSelect={selectStory}
          countries={selectedCountries}
          onAddCountry={(code) =>
            setCountries((current) => {
              const codes = current ?? []
              if (codes.includes(code) || codes.length >= COUNTRY_PICK_CAP) return codes
              return [...codes, code]
            })
          }
          onRemoveCountry={(code) => setCountries((current) => (current ?? []).filter((item) => item !== code))}
        />
      ) : (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="absolute top-4 left-4 z-10 rounded-full border border-white/10 bg-space/80 px-3 py-2 text-sm text-ink"
        >
          Hot list
        </button>
      )}
      <BreakingDock stories={breaking} panelOpen={panelOpen} detailOpen={selected !== null} onSelect={selectStory} />
      {selected ? <StoryPanel story={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  )
}

function countrySubtitle(placeReady: boolean, countries: { name: string }[]): string {
  if (!placeReady) return 'The list follows this device.'
  const name = countries[0]?.name
  if (countries.length === 1 && name) return `The globe faces ${name}.`
  if (countries.length > 1) return 'The globe frames the set.'
  return 'The newest breaking stories.'
}
