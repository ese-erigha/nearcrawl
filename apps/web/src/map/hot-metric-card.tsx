import { FEED_WINDOW_HEADING, FEED_WINDOW_LABEL, type FeedWindow } from './hot-window.ts'

type HotMetricCardProps = {
  total: number
  bars: number[]
  window: FeedWindow
  breaking: number
  alsoHot: number
  breakingOn: boolean
  alsoHotOn: boolean
  onBreaking: () => void
  onAlsoHot: () => void
}

export function HotMetricCard({
  total,
  bars,
  window,
  breaking,
  alsoHot,
  breakingOn,
  alsoHotOn,
  onBreaking,
  onAlsoHot,
}: HotMetricCardProps) {
  const peak = Math.max(1, ...bars)

  return (
    <section className="mt-4 rounded-[16px] bg-surface-2 px-3 pt-3 shadow-[inset_0_0_0_1px_var(--color-hairline)]">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] tracking-[0.08em] text-ink-4 uppercase">Stories</p>
        <p className="font-mono text-[10px] tracking-[0.08em] text-ink-4 uppercase">{FEED_WINDOW_HEADING[window]}</p>
      </div>
      <div className="mt-2 flex items-end justify-between gap-4">
        <p className="font-condensed text-5xl leading-none font-bold tracking-[-0.03em] text-ink">{total}</p>
        <div className="flex h-14 w-28 items-end gap-[3px] border-b border-dashed border-hairline" aria-hidden="true">
          {bars.map((count, index) => (
            <div
              key={index}
              className={count === 0 ? 'w-full rounded-t-sm bg-ink-4/30' : 'w-full rounded-t-sm bg-ink-2'}
              style={{ height: `${count === 0 ? 2 : Math.max(6, Math.round((count / peak) * 56))}px` }}
            />
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-start justify-between gap-3">
        <p className="text-[12px] text-ink-4">{total} sourced stories</p>
        <p className="text-[11px] text-ink-4">
          {FEED_WINDOW_LABEL[window]} ago
          <span className="px-2">·</span>
          now
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 border-t border-hairline">
        <button
          type="button"
          aria-pressed={breakingOn}
          onClick={onBreaking}
          className={breakingOn ? 'py-3 text-left' : 'py-3 text-left opacity-70 hover:opacity-100'}
        >
          <span className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
            <span className="size-1.5 rounded-full bg-breaking" />
            Breaking
          </span>
          <span className="mt-1 block font-condensed text-[28px] leading-none font-bold text-ink">{breaking}</span>
        </button>
        <button
          type="button"
          aria-pressed={alsoHotOn}
          onClick={onAlsoHot}
          className={
            alsoHotOn
              ? 'border-l border-hairline py-3 pl-3 text-left'
              : 'border-l border-hairline py-3 pl-3 text-left opacity-70 hover:opacity-100'
          }
        >
          <span className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
            <span className="size-1.5 rounded-full border border-ink-3" />
            Also hot
          </span>
          <span className="mt-1 block font-condensed text-[28px] leading-none font-bold text-ink">{alsoHot}</span>
        </button>
      </div>
    </section>
  )
}
