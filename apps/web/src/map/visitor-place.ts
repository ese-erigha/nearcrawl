import { regionName } from '../articles/article.ts'
import rawBorders from './country-borders.json' with { type: 'json' }

type Ring = [number, number][]

type CountryBorder = {
  iso: string
  rings: Ring[]
}

const BORDERS = rawBorders as CountryBorder[]

export type VisitorPlace = {
  code: string
  name: string
  latitude: number
  longitude: number
}

export function countryAt(latitude: number, longitude: number): { code: string; name: string } | null {
  const border = BORDERS.find((country) => country.iso.length === 2 && country.rings.some((ring) => ringContains(ring, longitude, latitude)))
  if (!border) return null
  return { code: border.iso, name: regionName(border.iso) }
}

export function readVisitorPlace(): Promise<VisitorPlace | null> {
  if (!navigator.geolocation) return Promise.resolve(null)
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        const country = countryAt(latitude, longitude)
        if (!country) {
          resolve(null)
          return
        }
        resolve({ ...country, latitude, longitude })
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    )
  })
}

function ringContains(ring: Ring, longitude: number, latitude: number): boolean {
  let inside = false
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const current = ring[index]
    const prior = ring[previous]
    if (!current || !prior) continue
    const [currentLon, currentLat] = current
    const [priorLon, priorLat] = prior
    const crosses = currentLat > latitude !== priorLat > latitude
    if (!crosses) continue
    const edge = ((priorLon - currentLon) * (latitude - currentLat)) / (priorLat - currentLat) + currentLon
    if (longitude < edge) inside = !inside
  }
  return inside
}
