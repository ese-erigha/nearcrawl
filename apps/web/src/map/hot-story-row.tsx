import { articleAge, articleTopic, type Article } from '../fixtures/home.fixture.ts'

type HotStoryRowProps = {
  story: Article
  selected: boolean
  onSelect: (id: string) => void
}

export function HotStoryRow({ story, selected, onSelect }: HotStoryRowProps) {
  const typeLabel = story.isBreaking ? 'Breaking' : articleTopic(story)

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(story.id)}
        className={
          selected
            ? 'w-full rounded-[14px] bg-surface-2 px-3 py-2.5 text-left ring-1 ring-white/50'
            : 'w-full rounded-[14px] bg-surface-2 px-3 py-2.5 text-left hover:bg-white/6'
        }
      >
        <span className="line-clamp-2 text-[14px] leading-snug font-medium tracking-[-0.005em] text-ink">
          {story.title}
        </span>
        <span className="mt-1.5 block text-[12.5px]">
          <span className="text-reported">{typeLabel}</span>
          <span className="text-ink-4">
            {' '}
            · {articleAge(story)} ago · {story.sourceName}
          </span>
        </span>
      </button>
    </li>
  )
}
