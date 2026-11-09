import { briefMapSvg, type BriefPin } from './brief-map.ts'
import { BRIEF_EYEBROW, BRIEF_TILE } from './brief-styles.ts'

type BriefDotMapProps = {
  pins: BriefPin[]
  storyCount: number
}

export function BriefDotMap({ pins, storyCount }: BriefDotMapProps) {
  const storyWord = storyCount === 1 ? 'story' : 'stories'
  const svg = briefMapSvg(pins)
  return (
    <figure className="mt-10 lg:col-span-2 lg:row-start-2">
      <div className={BRIEF_TILE}>
        <div
          role="img"
          aria-label={`World map of ${storyCount} ${storyWord} in the last 48 hours`}
          className="aspect-[1200/520] [&>svg]:block [&>svg]:size-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
      <figcaption className="mt-2.5 px-1">
        <span className={BRIEF_EYEBROW}>Where the stories are</span>
      </figcaption>
    </figure>
  )
}
