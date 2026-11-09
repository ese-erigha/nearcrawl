import type { BriefGroupView } from './brief-model.ts'
import { BriefStory } from './brief-story.tsx'

type BriefGroupProps = {
  group: BriefGroupView
}

export function BriefGroup({ group }: BriefGroupProps) {
  return (
    <section aria-labelledby={`${group.id}-title`} className="pt-12">
      <h2
        id={`${group.id}-title`}
        className="sticky top-0 z-[1] -mx-3 flex items-baseline justify-between border-b border-white/[0.06] bg-space px-3 pt-3 pb-2.5"
      >
        <span className="font-mono text-[10.5px] tracking-[0.08em] text-ink-3 uppercase">{group.label}</span>
        <span className="font-mono text-[10.5px] text-ink-4 tabular-nums">{group.items.length}</span>
      </h2>
      <ol start={group.items[0]?.number} className="list-none">
        {group.items.map((item) => (
          <BriefStory key={item.story.id} item={item} />
        ))}
      </ol>
    </section>
  )
}
