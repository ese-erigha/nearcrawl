import { listGlobalBreaking, type Story } from '../fixtures/home.fixture.ts'

const STORIES = listGlobalBreaking()

function StoryRun({ stories, hidden }: { stories: Story[]; hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center pl-1" aria-hidden={hidden || undefined} aria-label={hidden ? undefined : 'Global breaking stories'}>
      {stories.map((story) => (
        <li key={story.id} className="flex shrink-0 items-center">
          <span className="flex h-8 items-center gap-2 px-2.5 whitespace-nowrap">
            <span className="text-[11.5px] font-medium text-breaking">Breaking</span>
            <span className="text-[13px] font-medium text-ink">{story.title}</span>
            <span className="text-[11.5px] text-ink-4">{story.ageLabel}</span>
          </span>
          <span className="mx-1 h-3 w-px bg-white/10" aria-hidden />
        </li>
      ))}
    </ul>
  )
}

export function Ticker() {
  if (STORIES.length === 0) return null

  return (
    <div
      className="ticker flex h-10 min-w-0 items-center overflow-hidden rounded-full bg-surface pr-1 pl-3.5 shadow-[inset_0_0_0_1px_var(--color-hairline)]"
      style={{ ['--ticker-duration' as string]: `${STORIES.length * 5}s` }}
    >
      <span className="flex shrink-0 items-center gap-2 pr-2.5 text-[12px] text-ink-2">
        <span className="live-dot size-1.5 rounded-full bg-breaking" aria-hidden />
        <span className="font-mono text-[11px] tracking-[0.06em]">LIVE</span>
      </span>
      <span className="h-4 w-px shrink-0 bg-white/10" aria-hidden />
      <div className="ticker-mask min-w-0 flex-1 overflow-hidden">
        <div className="ticker-track flex w-max">
          <StoryRun stories={STORIES} />
          <StoryRun stories={STORIES} hidden />
        </div>
      </div>
    </div>
  )
}
