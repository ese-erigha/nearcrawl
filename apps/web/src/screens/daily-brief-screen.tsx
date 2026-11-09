import { BriefCrumbs, BriefHeader } from '../brief/brief-header.tsx'
import { BriefDotMap } from '../brief/brief-dot-map.tsx'
import { BriefGroup } from '../brief/brief-group.tsx'
import { BriefMetricCard } from '../brief/brief-metric-card.tsx'
import { buildBrief, buildUserBrief, type BriefView } from '../brief/brief-model.ts'
import { BriefRail } from '../brief/brief-rail.tsx'
import { PATH } from '../shell/navigation.constants.ts'

const PUBLIC_CRUMBS = [
  { label: 'Live map', href: PATH.MAP },
  { label: 'Daily brief' },
]

const USER_CRUMBS = [
  { label: 'Live map', href: PATH.MAP },
  { label: 'Daily brief', href: PATH.BRIEF },
  { label: 'Your brief' },
]

export function DailyBriefScreen() {
  return <BriefDocument brief={buildBrief()} crumbs={PUBLIC_CRUMBS} />
}

export function UserBriefScreen() {
  return <BriefDocument brief={buildUserBrief()} crumbs={USER_CRUMBS} />
}

function BriefDocument({ brief, crumbs }: { brief: BriefView; crumbs: { label: string; href?: string }[] }) {
  const pins = brief.groups.flatMap((group) =>
    group.items.map((item) => ({
      latitude: item.story.latitude,
      longitude: item.story.longitude,
      isBreaking: item.story.isBreaking,
    })),
  )

  return (
    <div className="absolute inset-0 overflow-auto">
      <div className="mx-auto w-full max-w-[1200px] px-5 pt-2 pb-24 sm:px-7">
        <BriefCrumbs items={crumbs} />
        <div className="mt-6 grid gap-x-12 lg:grid-cols-[minmax(0,1fr)_340px]">
          <BriefHeader brief={brief} />
          <BriefMetricCard brief={brief} />
          <BriefDotMap pins={pins} storyCount={brief.storyCount} />
          <div id="brief-stories" className="min-w-0 lg:col-start-1 lg:row-start-3">
            {brief.groups.map((group) => (
              <BriefGroup key={group.id} group={group} />
            ))}
          </div>
          <BriefRail brief={brief} />
        </div>
      </div>
    </div>
  )
}
