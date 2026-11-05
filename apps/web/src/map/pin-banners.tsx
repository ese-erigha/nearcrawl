import { articleAge, type Article } from '../fixtures/home.fixture.ts'
import { BANNER_HEIGHT, BANNER_WIDTH, type PlacedBanner } from './globe-math.ts'

type PinBannersProps = {
  stories: Article[]
  placed: PlacedBanner[]
  onSelect: (id: string) => void
}

export function PinBanners({ stories, placed, onSelect }: PinBannersProps) {
  const byId = new Map(stories.map((story) => [story.id, story]))

  return (
    <div className="pointer-events-none absolute inset-0 z-20 hidden md:block" aria-label="Stories on the globe">
      <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        {placed.map((item) => {
          const story = byId.get(item.id)
          const color = story?.isBreaking ? '#ff4a3d' : '#f2f2f2'
          const anchorX = item.side === 'right' ? item.left : item.left + BANNER_WIDTH
          const anchorY = item.top + BANNER_HEIGHT / 2
          const elbowX = item.side === 'right' ? anchorX - 12 : anchorX + 12
          return (
            <g key={item.id}>
              <polyline
                points={`${item.pinX},${item.pinY} ${elbowX},${anchorY} ${anchorX},${anchorY}`}
                fill="none"
                stroke="rgba(242,242,242,0.45)"
                strokeWidth="1"
              />
              <circle cx={item.pinX} cy={item.pinY} r="2.5" fill={color} />
            </g>
          )
        })}
      </svg>
      {placed.map((item) => {
        const story = byId.get(item.id)
        if (!story) return null
        const mark = story.sourceName.slice(0, 1)
        return (
          <div
            key={story.id}
            className="absolute top-0 left-0"
            style={{ transform: `translate3d(${item.left}px, ${item.top}px, 0)`, width: BANNER_WIDTH, height: BANNER_HEIGHT }}
          >
            <button
              type="button"
              onClick={() => onSelect(story.id)}
              className="pointer-events-auto flex h-full w-full cursor-pointer items-center gap-2 rounded-[10px] bg-space py-1 pr-3 pl-1 text-left ring-1 ring-white/10"
            >
              <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-surface-2 font-semicondensed text-[13px] font-semibold text-ink">
                {mark}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semicondensed text-[13.5px] leading-tight font-semibold text-ink">
                  {story.title}
                </span>
                <span className="flex items-center gap-1 text-[11px] leading-tight whitespace-nowrap text-ink-3">
                  <span className={story.isBreaking ? 'size-1.5 rounded-full bg-breaking' : 'size-1.5 rounded-full bg-ink-2'} />
                  {story.isBreaking ? 'Breaking' : story.sourceName}
                  <span className="text-ink-4">· {articleAge(story)}</span>
                </span>
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
