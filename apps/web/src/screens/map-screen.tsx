import { useEffect, useState } from 'react'

import { STORIES } from '../fixtures/home.fixture.ts'
import { BreakingDock } from '../map/breaking-dock.tsx'
import { GlobeCanvas } from '../map/globe-canvas.tsx'
import { DETAIL_MAP_INSET } from '../map/globe-math.ts'
import { HotPanel } from '../map/hot-panel.tsx'
import { StoryPanel } from '../map/story-panel.tsx'

export function MapScreen() {
  const [panelOpen, setPanelOpen] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = STORIES.find((story) => story.id === selectedId) ?? null

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const target = event.target
      if (target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="absolute inset-0">
      <GlobeCanvas
        stories={STORIES}
        insetLeft={panelOpen ? 400 : 16}
        insetRight={selected ? DETAIL_MAP_INSET : 0}
        insetBottom={196}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      {panelOpen ? <HotPanel onClose={() => setPanelOpen(false)} selectedId={selectedId} onSelect={setSelectedId} /> : null}
      {panelOpen ? null : (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="absolute top-4 left-4 z-10 rounded-full border border-white/10 bg-space/80 px-3 py-2 text-sm text-ink"
        >
          Hot list
        </button>
      )}
      <BreakingDock panelOpen={panelOpen} detailOpen={selected !== null} onSelect={setSelectedId} />
      {selected ? <StoryPanel story={selected} onClose={() => setSelectedId(null)} /> : null}
    </div>
  )
}
