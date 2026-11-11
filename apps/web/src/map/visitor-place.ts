import { countryCodeAt } from '../../../../packages/db/src/country-border.ts'

import { regionName } from '../articles/article.ts'

export type VisitorPlace = {
  code: string
  name: string
  latitude: number
  longitude: number
}

export function countryAt(latitude: number, longitude: number): { code: string; name: string } | null {
  const code = countryCodeAt(latitude, longitude)
  if (!code) return null
  return { code, name: regionName(code) }
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
