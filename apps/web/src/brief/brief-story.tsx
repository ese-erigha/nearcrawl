import { articleAge, type Article } from '../fixtures/home.fixture.ts'

type BriefStoryProps = {
  story: Article
}

export function BriefStory({ story }: BriefStoryProps) {
  return (
    <article className="border-t border-white/8 py-5">
      <h3 className="text-lg font-medium text-ink">{story.title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-2">{story.description}</p>
      <p className="mt-3 font-mono text-[10px] tracking-wide text-ink-4 uppercase">
        {story.sourceName} · {articleAge(story)}
      </p>
    </article>
  )
}
