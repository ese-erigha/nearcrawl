import rawBorders from '../../../../packages/db/src/country-borders.json' with { type: 'json' }

import { regionName } from '../articles/article.ts'

type CountryBorder = {
  iso: string
}

const BORDERS = rawBorders as CountryBorder[]

export const COUNTRY_PICK_CAP = 3

export type CountryChoice = {
  code: string
  name: string
}

export const COUNTRY_CHOICES: CountryChoice[] = BORDERS.filter((country) => country.iso.length === 2)
  .map((country) => ({ code: country.iso, name: regionName(country.iso) }))
  .sort((left, right) => left.name.localeCompare(right.name))
