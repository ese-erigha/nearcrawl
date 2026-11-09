import { CATEGORY, CATEGORY_LABEL, type Category } from '../fixtures/home.fixture.ts'

type HotCategoryChipsProps = {
  category: Category
  counts: Record<Category, number>
  onSelect: (category: Category) => void
}

const CATEGORIES = [CATEGORY.ALL, CATEGORY.POLITICS, CATEGORY.FINANCE, CATEGORY.DISASTER] as const

export function HotCategoryChips({ category, counts, onSelect }: HotCategoryChipsProps) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Topics">
      {CATEGORIES.map((item) => {
        const selected = item === category
        return (
          <button
            key={item}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(item)}
            className={
              selected
                ? 'rounded-full bg-ink px-3 py-1 text-[13px] text-space'
                : 'rounded-full px-3 py-1 text-[13px] text-ink-3 hover:text-ink'
            }
          >
            {CATEGORY_LABEL[item]}
            <span className={selected ? 'ml-1.5 text-space' : 'ml-1.5 text-ink-4'}>{counts[item]}</span>
          </button>
        )
      })}
    </div>
  )
}
