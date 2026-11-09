import { articleAge, articleTopic, type Article } from '../fixtures/home.fixture.ts'

type HotStoryRowProps = {
  story: Article
  selected: boolean
  onSelect: (id: string) => void
}

function sourceMark(name: string): string {
  const letters = name.replace(/[^A-Za-z]/g, '')
  return letters.slice(0, 2).toUpperCase()
}

export function HotStoryRow({ story, selected, onSelect }: HotStoryRowProps) {
  const status = story.isBreaking ? 'Breaking' : articleTopic(story)

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(story.id)}
        className={
          selected
            ? 'flex w-full gap-2.5 rounded-[14px] bg-surface-2 px-2.5 py-2.5 text-left ring-1 ring-white/40'
            : 'flex w-full gap-2.5 rounded-[14px] bg-surface-2 px-2.5 py-2.5 text-left hover:bg-white/6'
        }
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-surface font-mono text-[10px] font-medium tracking-wide text-ink-2">
          {sourceMark(story.sourceName)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="line-clamp-2 text-[14px] leading-snug font-medium tracking-[-0.005em] text-ink">
              {story.title}
            </span>
            <span className="shrink-0 pt-0.5 text-[11px] text-ink-4">{articleAge(story)}</span>
          </span>
          <span className="mt-1 block truncate text-[12px]">
            <span className={story.isBreaking ? 'text-breaking' : 'text-ink-3'}>{status}</span>
            {story.description ? <span className="text-ink-4"> · {story.description}</span> : null}
          </span>
        </span>
      </button>
    </li>
  )
}
