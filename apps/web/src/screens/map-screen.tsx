import { useEffect, useState } from 'react'

import type { Article } from '../articles/article.ts'
import { useLiveNews } from '../articles/use-live-news.ts'
import { listHotNews, listSpatialNews, WORLD_BOX, type NewsBox } from '../articles/news-api.ts'
import { BreakingDock } from '../map/breaking-dock.tsx'
import { GlobeCanvas } from '../map/globe-canvas.tsx'
import { DETAIL_MAP_INSET } from '../map/globe-math.ts'
import { HOT_PANEL_INSET, HotPanel } from '../map/hot-panel.tsx'
import { StoryPanel } from '../map/story-panel.tsx'

type ListStatus = 'loading' | 'ready' | 'error'

export function MapScreen() {
  const { place, placeReady, breaking } = useLiveNews()
  const [panelOpen, setPanelOpen] = useState(true)
  const [hot, setHot] = useState<Article[]>([])
  const [hotStatus, setHotStatus] = useState<ListStatus>('loading')
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
    if (!placeReady || !place) return
    let cancelled = false
    const load = async () => {
      setHotStatus('loading')
      const stories = await listHotNews(place.code)
      if (cancelled) return
      setHot(stories)
      setHotStatus('ready')
    }
    void load().catch(() => {
      if (cancelled) return
      setHotStatus('error')
    })
    return () => {
      cancelled = true
    }
  }, [place, placeReady])

  const list = place ? hot : breaking
  const title = !placeReady ? 'Finding your country' : place ? `Hot in ${place.name}` : 'Breaking worldwide'
  const subtitle = !placeReady ? 'The list follows this device.' : place ? 'Hot where you are.' : 'The newest breaking stories.'
  const status: ListStatus = place ? hotStatus : placeReady ? 'ready' : 'loading'
  const known = [...list, ...pins, ...breaking]
  const home = place ? { latitude: place.latitude, longitude: place.longitude } : null

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
