export const CATEGORY = {
  ALL: 'all',
  POLITICS: 'politics',
  FINANCE: 'finance',
  DISASTER: 'disaster',
} as const

export type Category = (typeof CATEGORY)[keyof typeof CATEGORY]

export const CATEGORY_LABEL: Record<Category, string> = {
  [CATEGORY.ALL]: 'All',
  [CATEGORY.POLITICS]: 'Politics',
  [CATEGORY.FINANCE]: 'Finance',
  [CATEGORY.DISASTER]: 'Disaster',
}

// Menu ids match packages/db CATEGORY.
export const TOPIC = {
  POLITICS: 1,
  DISASTER: 4,
  FINANCE: 6,
} as const
