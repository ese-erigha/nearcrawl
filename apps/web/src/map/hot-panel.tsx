import { MagnifyingGlass, Newspaper, X } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import type { Article } from '../articles/article.ts'
import { CATEGORY, type Category } from '../articles/topics.ts'
import { PATH } from '../shell/navigation.constants.ts'
import type { CountryChoice } from './country-choices.ts'
import { HotCategoryChips } from './hot-category-chips.tsx'
import { HotCountryControl } from './hot-country-control.tsx'
import { HotMetricCard } from './hot-metric-card.tsx'
import { HotStoryRow } from './hot-story-row.tsx'
import { HotTimeSwitch } from './hot-time-switch.tsx'
import {
  FEED_WINDOW,
  categoryCounts,
  matchesCategory,
  storiesInWindow,
  storyBars,
  type FeedWindow,
} from './hot-window.ts'

export const HOT_PANEL_WIDTH = 420
export const HOT_PANEL_INSET = HOT_PANEL_WIDTH + 32

const LIST_FILTER = {
  ALL: 'all',
  BREAKING: 'breaking',
  ALSO_HOT: 'also-hot',
} as const

type ListFilter = (typeof LIST_FILTER)[keyof typeof LIST_FILTER]

type HotPanelProps = {
  title: string
  subtitle: string
  stories: Article[]
  status: 'loading' | 'ready' | 'error'
  onClose: () => void
  selectedId: string | null
  onSelect: (id: string) => void
  countries: CountryChoice[]
  onAddCountry: (code: string) => void
  onRemoveCountry: (code: string) => void
}

function matchesFilter(story: Article, filter: ListFilter): boolean {
  if (filter === LIST_FILTER.BREAKING) return story.isBreaking
  if (filter === LIST_FILTER.ALSO_HOT) return !story.isBreaking
  return true
}

export function HotPanel({
  title,
  subtitle,
  stories,
  status,
  onClose,
  selectedId,
  onSelect,
  countries,
  onAddCountry,
  onRemoveCountry,
}: HotPanelProps) {
  const [category, setCategory] = useState<Category>(CATEGORY.ALL)
  const [feedWindow, setFeedWindow] = useState<FeedWindow>(FEED_WINDOW.FEED)
  const [filter, setFilter] = useState<ListFilter>(LIST_FILTER.ALL)
  const [query, setQuery] = useState('')
  const inWindow = storiesInWindow(stories, feedWindow)
  const bars = storyBars(inWindow, feedWindow)
  const breaking = inWindow.filter((story) => story.isBreaking).length
  const afterStatus = inWindow.filter((story) => matchesFilter(story, filter))
  const counts = categoryCounts(afterStatus)
  const needle = query.trim().toLowerCase()
  const visible = afterStatus.filter(
    (story) => matchesCategory(story, category) && (needle.length === 0 || story.title.toLowerCase().includes(needle)),
  )
  const breakingStories = visible.filter((story) => story.isBreaking)
  const alsoHotStories = visible.filter((story) => !story.isBreaking)
  const toggle = (next: ListFilter) => setFilter((current) => (current === next ? LIST_FILTER.ALL : next))

  return (
    <aside
      style={{ width: HOT_PANEL_WIDTH }}
      className="absolute top-4 bottom-4 left-4 z-10 flex max-w-[calc(100%-2rem)] flex-col overflow-auto rounded-[22px] bg-surface p-4 shadow-[inset_0_0_0_1px_var(--color-hairline),0_12px_32px_rgb(0_0_0/0.35)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-condensed text-[32px] leading-[0.95] font-bold tracking-[-0.02em] text-ink">{title}</h1>
        <button
          type="button"
          aria-label="Close the country list"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-[8px] text-ink-3 shadow-[inset_0_0_0_1px_var(--color-hairline)] hover:bg-white/5"
        >
          <X size={14} />
        </button>
      </div>
      <HotCountryControl countries={countries} onAdd={onAddCountry} onRemove={onRemoveCountry} />
      <p className="mt-3 text-[14px] leading-snug text-ink-3">{subtitle}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[13px] text-ink-2">
          <span className="mr-2 inline-block size-1.5 rounded-full bg-live" />
          Live · 14-day feed
        </p>
        <HotTimeSwitch window={feedWindow} onSelect={setFeedWindow} />
      </div>
      <HotMetricCard
        total={inWindow.length}
        bars={bars}
        window={feedWindow}
        breaking={breaking}
        alsoHot={inWindow.length - breaking}
        breakingOn={filter === LIST_FILTER.BREAKING}
        alsoHotOn={filter === LIST_FILTER.ALSO_HOT}
        onBreaking={() => toggle(LIST_FILTER.BREAKING)}
        onAlsoHot={() => toggle(LIST_FILTER.ALSO_HOT)}
      />
      <p className="mt-3 text-[12px] leading-relaxed text-ink-4">
        {status === 'loading' ? 'Loading stories.' : null}
        {status === 'error' ? 'The story list did not load.' : null}
        {status === 'ready' && countries.length > 0
          ? 'The number is the hot list for the selected countries. A status filters the list.'
          : null}
        {status === 'ready' && countries.length === 0
          ? 'The list is worldwide breaking news. Add a country to load a hot list.'
          : null}
      </p>
      <label className="relative mt-3 block">
        <span className="sr-only">Search this region</span>
        <MagnifyingGlass size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-4" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search this region"
          className="w-full rounded-full border border-white/15 bg-black py-2 pr-9 pl-9 text-sm text-ink outline-none placeholder:text-ink-4"
        />
        {query.length > 0 ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery('')}
            className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-4 hover:text-ink"
          >
            <X size={12} />
          </button>
        ) : null}
      </label>
      <Link to={PATH.BRIEF} className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink">
        <Newspaper size={14} />
        Daily brief
      </Link>
      <div className="mt-3">
        <HotCategoryChips category={category} counts={counts} onSelect={setCategory} />
      </div>
      {status === 'ready' && visible.length === 0 ? (
        <p className="mt-4 text-[13px] text-ink-3">No stories in this window.</p>
      ) : null}
      <div className="mt-4 space-y-4">
        {breakingStories.length > 0 ? (
          <section aria-label="Breaking">
            <h2 className="mb-2 font-mono text-[10.5px] tracking-[0.08em] text-ink-4 uppercase">Breaking</h2>
            <ul className="space-y-2">
              {breakingStories.map((story) => (
                <HotStoryRow key={story.id} story={story} selected={story.id === selectedId} onSelect={onSelect} />
              ))}
            </ul>
          </section>
        ) : null}
        {alsoHotStories.length > 0 ? (
          <section aria-label="Also hot">
            <h2 className="mb-2 font-mono text-[10.5px] tracking-[0.08em] text-ink-4 uppercase">Also hot</h2>
            <ul className="space-y-2">
              {alsoHotStories.map((story) => (
                <HotStoryRow key={story.id} story={story} selected={story.id === selectedId} onSelect={onSelect} />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </aside>
  )
}
