export const PATH = {
  MAP: '/',
  BRIEF: '/brief',
} as const

export type Path = (typeof PATH)[keyof typeof PATH]

export const REPOSITORY_URL = 'https://github.com/ese-erigha/nearcrawl'

export const GEOAPIFY_URL = 'https://www.geoapify.com/'

export const OPENSTREETMAP_COPYRIGHT_URL = 'https://www.openstreetmap.org/copyright'
