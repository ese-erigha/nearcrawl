import { Link } from 'react-router-dom'

import { listCountryStories, VISITOR_COUNTRY, CATEGORY } from '../fixtures/home.fixture.ts'
import { PATH } from '../shell/navigation.constants.ts'

const BRIEF_DATE = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date())

export function BriefHeader() {
  const count = listCountryStories(CATEGORY.ALL, '').length

  return (
    <header>
      <p className="font-mono text-[11px] tracking-[0.08em] text-ink-4 uppercase">
        <Link to={PATH.MAP} className="hover:text-ink">
          Live map
        </Link>
        <span className="px-2">/</span>
        Daily brief
      </p>
      <p className="mt-8 font-mono text-[11px] tracking-[0.08em] text-ink-4 uppercase">
        Daily brief · {BRIEF_DATE} · {VISITOR_COUNTRY}
      </p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl leading-none font-semibold tracking-tight text-ink">
        What is hot in {VISITOR_COUNTRY}
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-ink-2">
        This sample brief uses the same country list as the map. Breaking stories come first.
        A cited opening paragraph waits for a later answer route.
      </p>
      <Link
        to={PATH.MAP}
        className="mt-6 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-medium text-space"
      >
        Open the live map
      </Link>
      <p className="mt-8 font-mono text-[11px] tracking-[0.08em] text-ink-4 uppercase">
        {count} stories
      </p>
    </header>
  )
}
