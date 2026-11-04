import { X } from '@phosphor-icons/react'
import { useState } from 'react'

import {
  CATEGORY,
  listCountryStories,
  VISITOR_COUNTRY,
  type Category,
} from '../fixtures/home.fixture.ts'
import { HotCategoryChips } from './hot-category-chips.tsx'
import { HotStoryRow } from './hot-story-row.tsx'

type HotPanelProps = {
  onClose: () => void
  selectedId: string | null
  onSelect: (id: string) => void
}

export function HotPanel({ onClose, selectedId, onSelect }: HotPanelProps) {
  const [category, setCategory] = useState<Category>(CATEGORY.ALL)
  const [query, setQuery] = useState('')
  const stories = listCountryStories(category, query)

  return (
    <aside className="absolute top-4 bottom-4 left-4 z-10 flex w-[22rem] max-w-[calc(100%-2rem)] flex-col rounded-[22px] bg-surface p-4 shadow-[inset_0_0_0_1px_var(--color-hairline),0_12px_32px_rgb(0_0_0/0.35)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-condensed text-[28px] leading-none font-bold tracking-[-0.02em] text-ink">
            Hot in {VISITOR_COUNTRY}
          </h1>
          <p className="mt-1 text-sm text-ink-3">Hot where you are.</p>
        </div>
        <button
          type="button"
          aria-label="Close the country list"
          onClick={onClose}
          className="rounded-full p-1.5 text-ink-3 hover:bg-white/5"
        >
          <X size={16} />
        </button>
      </div>
      <p className="mt-3 font-mono text-[10px] tracking-wide text-ink-4 uppercase">
        <span className="mr-2 inline-block size-1.5 rounded-full bg-emerald-300" />
        Sample · 14-day feed
      </p>
      <p className="mt-4 font-condensed text-5xl leading-none font-bold tracking-[-0.03em] text-ink">
        {stories.length}
      </p>
      <p className="mt-1 font-mono text-[10px] tracking-wide text-ink-4 uppercase">stories</p>
      <div className="mt-4">
        <HotCategoryChips category={category} onSelect={setCategory} />
      </div>
      <label className="mt-3 block">
        <span className="sr-only">Search this region</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search this region"
          className="w-full rounded-full border border-white/10 bg-white/4 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-4"
        />
      </label>
      <ul className="mt-3 min-h-0 flex-1 space-y-1 overflow-auto pr-1">
        {stories.map((story) => (
          <HotStoryRow key={story.id} story={story} selected={story.id === selectedId} onSelect={onSelect} />
        ))}
      </ul>
    </aside>
  )
}
