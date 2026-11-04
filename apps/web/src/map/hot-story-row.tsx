import { CATEGORY_LABEL, type Story } from '../fixtures/home.fixture.ts'

const COUNTRY_CODE: Record<string, string> = {
  Japan: 'JP',
  'United States': 'US',
  'United Kingdom': 'GB',
  Nigeria: 'NG',
  Germany: 'DE',
}

type HotStoryRowProps = {
  story: Story
  selected: boolean
  onSelect: (id: string) => void
}

export function HotStoryRow({ story, selected, onSelect }: HotStoryRowProps) {
  const code = COUNTRY_CODE[story.country] ?? story.country.slice(0, 2).toUpperCase()
  const typeLabel = story.isBreaking ? 'Breaking' : CATEGORY_LABEL[story.category]

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(story.id)}
        className={
          selected
            ? 'flex w-full items-center gap-3 rounded-[14px] bg-white/6 px-2 py-2 text-left ring-1 ring-white/10'
            : 'flex w-full items-center gap-3 rounded-[14px] px-2 py-2 text-left hover:bg-white/4'
        }
      >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-surface-2 font-mono text-[11px] text-ink-2">
        {code}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium tracking-[-0.005em] text-ink">{story.title}</span>
        <span className="mt-[3px] flex items-center gap-1.5 text-[12.5px]">
          <span className="text-reported">{typeLabel}</span>
          <span className="text-ink-4">{story.ageLabel} ago</span>
        </span>
      </span>
      </button>
    </li>
  )
}
