import { FEED_WINDOW, FEED_WINDOW_LABEL, type FeedWindow } from './hot-window.ts'

const WINDOWS = [FEED_WINDOW.DAY, FEED_WINDOW.WEEK, FEED_WINDOW.FEED] as const

type HotTimeSwitchProps = {
  window: FeedWindow
  onSelect: (window: FeedWindow) => void
}

export function HotTimeSwitch({ window, onSelect }: HotTimeSwitchProps) {
  return (
    <div className="flex rounded-full bg-black/40 p-0.5" role="group" aria-label="Feed window">
      {WINDOWS.map((item) => {
        const selected = item === window
        return (
          <button
            key={item}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(item)}
            className={
              selected
                ? 'rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-medium text-ink'
                : 'rounded-full px-2.5 py-1 text-[12px] font-medium text-ink-4 hover:text-ink'
            }
          >
            {FEED_WINDOW_LABEL[item]}
          </button>
        )
      })}
    </div>
  )
}
