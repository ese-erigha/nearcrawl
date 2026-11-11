import { ArrowUpRight, CaretRight, GlobeHemisphereWest } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

import { PATH } from '../shell/navigation.constants.ts'
import { BriefCopyThread } from './brief-copy-thread.tsx'
import type { BriefView } from './brief-model.ts'
import { BRIEF_EYEBROW, BRIEF_PRIMARY, BRIEF_TERTIARY } from './brief-styles.ts'

type BriefCrumb = {
  label: string
  href?: string
}

type BriefHeaderProps = {
  brief: BriefView
}

export function BriefCrumbs({ items }: { items: BriefCrumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="pt-2">
      <ol className="flex flex-wrap items-center gap-1 text-[12.5px] text-ink-4">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1">
            {index > 0 ? <CaretRight className="size-3 text-ink-4/70" aria-hidden /> : null}
            {item.href ? (
              <Link to={item.href} className="rounded-full px-1.5 py-0.5 hover:bg-white/[0.05] hover:text-ink-2">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="px-1.5 text-ink-3">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function BriefHeader({ brief }: BriefHeaderProps) {
  return (
    <header className="min-w-0 lg:col-start-1 lg:row-start-1">
      <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className={BRIEF_EYEBROW}>Daily brief</span>
        <span aria-hidden className="size-[3px] rounded-full bg-ink-4" />
        <span className={`${BRIEF_EYEBROW} text-ink-3`}>{brief.dayLabel}</span>
      </p>
      <h1 className="mt-3 max-w-[18ch] font-semicondensed text-[clamp(34px,4.6vw,56px)] leading-[1] font-bold tracking-[-0.02em] text-balance text-ink">
        {brief.headline}
      </h1>
      <p className="mt-4 text-[12.5px] leading-relaxed text-ink-4">{brief.byline}</p>
      {brief.summary ? (
        <p className="mt-5 line-clamp-6 max-w-[64ch] text-[17px] leading-relaxed text-pretty text-ink">{brief.summary}</p>
      ) : null}
      <div className="mt-6 grid gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Link to={PATH.MAP} className={BRIEF_PRIMARY}>
          <GlobeHemisphereWest className="size-3.5" /> Open the live map
        </Link>
        <BriefCopyThread posts={brief.thread} />
        <a href="#brief-stories" className={`${BRIEF_TERTIARY} h-10 justify-center px-3 text-[13.5px]`}>
          Read the full report <ArrowUpRight className="size-3.5" />
        </a>
      </div>
    </header>
  )
}
