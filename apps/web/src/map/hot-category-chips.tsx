import { CATEGORY, CATEGORY_LABEL, type Category } from '../fixtures/home.fixture.ts'

type HotCategoryChipsProps = {
  category: Category
  onSelect: (category: Category) => void
}

const CATEGORIES = [CATEGORY.ALL, CATEGORY.POLITICS, CATEGORY.FINANCE, CATEGORY.DISASTER] as const

export function HotCategoryChips({ category, onSelect }: HotCategoryChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
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
                ? 'rounded-full bg-ink px-2.5 py-1 font-mono text-[10px] tracking-wide text-space uppercase'
                : 'rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wide text-ink-3 uppercase hover:bg-white/5'
            }
          >
            {CATEGORY_LABEL[item]}
          </button>
        )
      })}
    </div>
  )
}
