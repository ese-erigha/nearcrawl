import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useRef } from 'react'

import { listGlobalBreaking } from '../fixtures/home.fixture.ts'
import { DETAIL_MAP_INSET } from './globe-math.ts'
import { BreakingCard } from './breaking-card.tsx'

type BreakingDockProps = {
  panelOpen: boolean
  detailOpen: boolean
  onSelect: (id: string) => void
}

export function BreakingDock({ panelOpen, detailOpen, onSelect }: BreakingDockProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const stories = listGlobalBreaking()

  const scrollByCard = (direction: -1 | 1) => {
    const scroller = scrollerRef.current
    if (!scroller) return
    scroller.scrollBy({ left: direction * 240, behavior: 'smooth' })
  }

  return (
    <section
      aria-label="Global Breaking News"
      className="absolute bottom-4 z-10 rounded-[22px] bg-[#0c0c0c] p-3 shadow-[inset_0_0_0_1px_var(--color-hairline),0_12px_32px_rgb(0_0_0/0.35)]"
      style={{
        left: panelOpen ? '24.5rem' : 16,
        right: detailOpen ? DETAIL_MAP_INSET + 16 : 16,
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase">
          Global Breaking News
        </h2>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Previous stories"
            onClick={() => scrollByCard(-1)}
            className="rounded-full p-1.5 text-ink-3 hover:bg-white/5"
          >
            <CaretLeft size={14} />
          </button>
          <button
            type="button"
            aria-label="Next stories"
            onClick={() => scrollByCard(1)}
            className="rounded-full p-1.5 text-ink-3 hover:bg-white/5"
          >
            <CaretRight size={14} />
          </button>
        </div>
      </div>
      <div ref={scrollerRef} className="flex gap-3 overflow-x-auto pb-1">
        {stories.map((story) => (
          <BreakingCard key={story.id} story={story} onSelect={onSelect} />
        ))}
      </div>
    </section>
  )
}
