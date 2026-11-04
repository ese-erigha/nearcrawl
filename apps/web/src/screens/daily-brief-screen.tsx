import { BriefGroup } from '../brief/brief-group.tsx'
import { BriefHeader } from '../brief/brief-header.tsx'
import { listBriefGroups } from '../fixtures/home.fixture.ts'

export function DailyBriefScreen() {
  const groups = listBriefGroups()

  return (
    <div className="absolute inset-0 overflow-auto">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <BriefHeader />
        {groups.map((group) => (
          <BriefGroup key={group.id} label={group.label} stories={group.stories} />
        ))}
      </div>
    </div>
  )
}
