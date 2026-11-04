export const VISITOR_COUNTRY = 'Japan'

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

export const BRIEF_GROUP = {
  BREAKING: 'breaking',
  ALSO_HOT: 'also-hot',
} as const

export type BriefGroupId = (typeof BRIEF_GROUP)[keyof typeof BRIEF_GROUP]

export type Story = {
  id: string
  title: string
  description: string
  sourceName: string
  country: string
  category: Exclude<Category, typeof CATEGORY.ALL>
  latitude: number
  longitude: number
  ageLabel: string
  isBreaking: boolean
}

export const STORIES: Story[] = [
  {
    id: 'kyushu-typhoon',
    title: 'Typhoon watch covers Kyushu ports',
    description: 'Ferries stop and coastal roads close as the storm turns toward the southwest.',
    sourceName: 'Kyodo',
    country: 'Japan',
    category: CATEGORY.DISASTER,
    latitude: 32.8,
    longitude: 130.7,
    ageLabel: '2h',
    isBreaking: true,
  },
  {
    id: 'boj-hint',
    title: 'Nikkei slips after a rate hint',
    description: 'Traders cut bank shares after an official signaled a closer look at the next move.',
    sourceName: 'Nikkei',
    country: 'Japan',
    category: CATEGORY.FINANCE,
    latitude: 35.68,
    longitude: 139.76,
    ageLabel: '5h',
    isBreaking: true,
  },
  {
    id: 'diet-defense',
    title: 'Diet opens the defense budget debate',
    description: 'Lawmakers argue over shipyard spending before the autumn session ends.',
    sourceName: 'Asahi',
    country: 'Japan',
    category: CATEGORY.POLITICS,
    latitude: 35.67,
    longitude: 139.75,
    ageLabel: '6h',
    isBreaking: false,
  },
  {
    id: 'hokkaido-quake',
    title: 'Small quake felt across southern Hokkaido',
    description: 'No tsunami warning follows the shake. Rail checks continue through the evening.',
    sourceName: 'NHK',
    country: 'Japan',
    category: CATEGORY.DISASTER,
    latitude: 42.3,
    longitude: 140.9,
    ageLabel: '9h',
    isBreaking: false,
  },
  {
    id: 'osaka-expo',
    title: 'Osaka crowd record falls on a clear Saturday',
    description: 'The waterfront stays open late after the day count passes the spring mark.',
    sourceName: 'Mainichi',
    country: 'Japan',
    category: CATEGORY.POLITICS,
    latitude: 34.65,
    longitude: 135.39,
    ageLabel: '1d',
    isBreaking: false,
  },
  {
    id: 'us-ports',
    title: 'East Coast ports slow as the strike spreads',
    description: 'Containers sit at the gate from Savannah to New York.',
    sourceName: 'Reuters',
    country: 'United States',
    category: CATEGORY.FINANCE,
    latitude: 40.7,
    longitude: -74.0,
    ageLabel: '1h',
    isBreaking: true,
  },
  {
    id: 'uk-floods',
    title: 'Floodwater closes the northern rail spine',
    description: 'Evening services stop between Manchester and Leeds.',
    sourceName: 'BBC',
    country: 'United Kingdom',
    category: CATEGORY.DISASTER,
    latitude: 53.5,
    longitude: -2.2,
    ageLabel: '3h',
    isBreaking: true,
  },
  {
    id: 'lagos-depot',
    title: 'Lagos fuel queues grow after a depot fire',
    description: 'Stations limit sales while crews keep the road around the depot shut.',
    sourceName: 'Premium Times',
    country: 'Nigeria',
    category: CATEGORY.DISASTER,
    latitude: 6.45,
    longitude: 3.4,
    ageLabel: '4h',
    isBreaking: true,
  },
  {
    id: 'ruhr-factory',
    title: 'Factory fire stops a Ruhr steel line',
    description: 'Night shift workers leave the site. The furnace stays offline.',
    sourceName: 'DW',
    country: 'Germany',
    category: CATEGORY.FINANCE,
    latitude: 51.5,
    longitude: 7.1,
    ageLabel: '8h',
    isBreaking: true,
  },
]

export function listCountryStories(category: Category, query: string): Story[] {
  const needle = query.trim().toLowerCase()
  return STORIES.filter((story) => story.country === VISITOR_COUNTRY)
    .filter((story) => category === CATEGORY.ALL || story.category === category)
    .filter((story) => needle.length === 0 || story.title.toLowerCase().includes(needle))
}

export function listGlobalBreaking(): Story[] {
  return STORIES.filter((story) => story.isBreaking)
}

export function listBriefGroups(): { id: BriefGroupId; label: string; stories: Story[] }[] {
  const countryStories = listCountryStories(CATEGORY.ALL, '')
  return [
    {
      id: BRIEF_GROUP.BREAKING,
      label: 'Breaking',
      stories: countryStories.filter((story) => story.isBreaking),
    },
    {
      id: BRIEF_GROUP.ALSO_HOT,
      label: 'Also hot',
      stories: countryStories.filter((story) => !story.isBreaking),
    },
  ]
}
