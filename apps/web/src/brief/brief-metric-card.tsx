import type { BriefView } from './brief-model.ts'
import { BRIEF_EYEBROW, BRIEF_TILE } from './brief-styles.ts'

type BriefMetricCardProps = {
  brief: BriefView
}

const COLUMNS = [
  { key: 'breaking', label: 'Breaking', value: (brief: BriefView) => brief.breakingCount, mark: 'solid' },
  { key: 'also-hot', label: 'Also hot', value: (brief: BriefView) => brief.alsoHotCount, mark: 'hollow' },
  { key: 'sources', label: 'Sources', value: (brief: BriefView) => brief.sourceCount, mark: 'ring' },
] as const

export function BriefMetricCard({ brief }: BriefMetricCardProps) {
  const countryWord = brief.countryCount === 1 ? 'country' : 'countries'
  const rows = [...brief.topicCounts, { label: 'Shares', count: brief.shareTotal }]
  return (
    <section className={`${BRIEF_TILE} mt-8 lg:col-start-2 lg:row-start-1 lg:mt-0 lg:self-start`} aria-label="Brief counts">
      <div className="flex items-center justify-between gap-3 px-4 pt-3.5 sm:px-5">
        <span className={BRIEF_EYEBROW}>Stories</span>
        <span className={BRIEF_EYEBROW}>Last 48 hours</span>
      </div>
      <p className="flex items-baseline gap-2.5 px-4 pt-1.5 pb-4 sm:px-5">
        <span className="font-condensed text-[68px] leading-[0.86] font-bold tracking-[-0.035em] text-ink">{brief.storyCount}</span>
        <span className="text-[13px] text-ink-3">
          in {brief.countryCount} {countryWord}
        </span>
      </p>
      <dl className="grid grid-cols-3 border-t border-white/[0.06]">
        {COLUMNS.map((column, index) => (
          <div key={column.key} className={index > 0 ? 'min-w-0 border-l border-white/[0.06] px-4 py-3' : 'min-w-0 px-4 py-3'}>
            <dt className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
              <CountMark kind={column.mark} />
              {column.label}
            </dt>
            <dd className="mt-1 text-[18px] leading-none font-semibold tracking-[-0.01em] text-ink tabular-nums">{column.value(brief)}</dd>
          </div>
        ))}
      </dl>
      <dl className="border-t border-white/[0.06] px-4 py-2 sm:px-5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-1.5">
            <dt className="text-[12.5px] text-ink-3">{row.label}</dt>
            <dd className="font-mono text-[12px] text-ink tabular-nums">{row.count}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function CountMark({ kind }: { kind: 'solid' | 'hollow' | 'ring' }) {
  if (kind === 'solid') {
    return (
      <svg width="8" height="8" viewBox="0 0 10 10" className="shrink-0 text-breaking" aria-hidden>
        <circle cx="5" cy="5" r="4.25" fill="currentColor" />
      </svg>
    )
  }
  const stroke = kind === 'hollow' ? '#dedede' : '#a3a3a3'
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" className="shrink-0" aria-hidden>
      <circle cx="5" cy="5" r="3.75" fill="none" stroke={stroke} strokeWidth="1.5" />
    </svg>
  )
}
