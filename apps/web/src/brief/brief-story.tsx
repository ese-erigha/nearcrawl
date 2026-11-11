import { ArrowUpRight } from '@phosphor-icons/react'

import type { BriefItem } from './brief-model.ts'
import { BRIEF_CHIP, BRIEF_TERTIARY } from './brief-styles.ts'

type BriefStoryProps = {
  item: BriefItem
}

export function BriefStory({ item }: BriefStoryProps) {
  const number = String(item.number).padStart(2, '0')
  return (
    <li className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 border-t border-white/[0.06] py-6 first:border-t-0 first:pt-3 sm:grid-cols-[36px_minmax(0,1fr)]">
      <span aria-hidden className="pt-[3px] font-mono text-[11px] text-ink-4 tabular-nums">
        {number}
      </span>
      <div className="min-w-0">
        <h3 className="flex items-start gap-2.5 text-[16.5px] leading-snug font-medium tracking-[-0.005em] text-pretty text-ink">
          <span className="sr-only">{item.story.isBreaking ? 'Breaking:' : 'Also hot:'}</span>
          <span>{item.story.title}</span>
        </h3>
        <StoryLead text={item.story.description?.trim() || item.story.body.trim()} />
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          <span className={BRIEF_CHIP}>{item.story.sourceName}</span>
          <a href={item.story.sourceUrl} target="_blank" rel="noreferrer" className={BRIEF_TERTIARY}>
            {item.host} <ArrowUpRight className="size-3" />
          </a>
        </div>
      </div>
    </li>
  )
}

function StoryLead({ text }: { text: string }) {
  const lead = text.trim()
  if (!lead) return null
  return <p className="mt-1.5 line-clamp-3 max-w-[68ch] text-[14.5px] leading-relaxed text-pretty text-ink-2">{lead}</p>
}

