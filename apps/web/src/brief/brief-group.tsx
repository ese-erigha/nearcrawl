import type { Story } from '../fixtures/home.fixture.ts'
import { BriefStory } from './brief-story.tsx'

type BriefGroupProps = {
  label: string
  stories: Story[]
}

export function BriefGroup({ label, stories }: BriefGroupProps) {
  return (
    <section className="mt-10">
      <h2 className="font-mono text-[11px] tracking-[0.08em] text-ink-4 uppercase">
        {label} {stories.length}
      </h2>
      {stories.map((story) => (
        <BriefStory key={story.id} story={story} />
      ))}
    </section>
  )
}
