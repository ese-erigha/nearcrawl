import { X } from '@phosphor-icons/react'

import { articleAge, articleCountry, articleTopic, type Article } from '../fixtures/home.fixture.ts'

type StoryPanelProps = {
  story: Article
  onClose: () => void
}

export function StoryPanel({ story, onClose }: StoryPanelProps) {
  const topic = articleTopic(story)
  const typeLabel = story.isBreaking ? 'Breaking' : topic
  const country = articleCountry(story)
  const age = articleAge(story)
  const facts = [country, topic, story.sourceName, `${age} ago`]
  if (story.readTimeMinutes) facts.push(`${story.readTimeMinutes} min`)

  return (
    <aside
      aria-label={`${story.title} details`}
      className="absolute top-[76px] right-4 bottom-4 z-30 flex w-[440px] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-[22px] bg-surface shadow-[inset_0_0_0_1px_var(--color-hairline)]"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute top-3.5 right-3.5 z-10 flex size-8 items-center justify-center rounded-full bg-white/6 text-ink-2 ring-1 ring-white/8 hover:bg-white/12 hover:text-ink"
      >
        <X size={16} />
      </button>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6 pb-6">
        <div className="flex items-center gap-3.5 pr-10">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[12px] bg-surface-2 font-semicondensed text-[18px] font-semibold text-ink">
            {story.sourceName.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <h2 className="font-semicondensed text-[22px] leading-[1.1] font-bold tracking-[-0.01em] text-ink">
              {story.title}
            </h2>
            <p className="mt-1 truncate text-[13px] text-ink-3">{country}</p>
          </div>
        </div>
        <div className="mt-5">
          <span
            className={
              story.isBreaking
                ? 'inline-flex items-center gap-1.5 rounded-full bg-breaking/12 px-2.5 py-1 text-[12px] font-medium text-breaking'
                : 'inline-flex items-center gap-1.5 rounded-full bg-reported/12 px-2.5 py-1 text-[12px] font-medium text-reported'
            }
          >
            <span className={story.isBreaking ? 'size-1.5 rounded-full bg-breaking' : 'size-1.5 rounded-full bg-reported'} />
            {typeLabel}
          </span>
          <p className="mt-2 text-[13px] leading-snug text-ink-3">
            {story.isBreaking ? 'Breaking.' : `${typeLabel}.`} Reported {age} ago.
          </p>
        </div>
        <p className="mt-5 text-[15px] leading-relaxed text-ink-2">{story.body}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {facts.map((fact) => (
            <span
              key={fact}
              className="inline-flex h-7 items-center rounded-full bg-white/4 px-2.5 text-[12px] text-ink-2 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]"
            >
              {fact}
            </span>
          ))}
        </div>
        <p className="mt-6 border-t border-white/6 pt-4 text-[12px] text-ink-4">
          Source · {story.sourceName}
          {story.authorName ? ` · ${story.authorName}` : ''}
        </p>
      </div>
    </aside>
  )
}
