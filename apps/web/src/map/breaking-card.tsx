import type { Story } from '../fixtures/home.fixture.ts'

type BreakingCardProps = {
  story: Story
  onSelect: (id: string) => void
}

export function BreakingCard({ story, onSelect }: BreakingCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(story.id)}
      className="w-56 shrink-0 rounded-[18px] bg-surface-2 p-3 text-left shadow-[inset_0_0_0_1px_var(--color-hairline)]"
    >
      <p className="font-mono text-[10px] tracking-wide text-breaking uppercase">
        {story.country} · {story.ageLabel}
      </p>
      <h3 className="mt-2 line-clamp-2 text-sm font-medium text-ink">{story.title}</h3>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-3">{story.description}</p>
    </button>
  )
}
