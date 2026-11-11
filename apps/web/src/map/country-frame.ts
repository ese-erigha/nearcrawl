import rawBorders from '../../../../packages/db/src/country-borders.json' with { type: 'json' }

import { FOCUS_RADIUS_SCALE } from './globe-math.ts'

type Ring = [number, number][]

type CountryBorder = {
  iso: string
  rings: Ring[]
}

const BORDERS = rawBorders as CountryBorder[]
const FRAME_PAD = 16

export type CountryFocus = {
  longitude: number
  latitude: number
  radiusScale: number
}

export function countryFocus(codes: string[]): CountryFocus | null {
  const points = pointsFor(codes)
  if (points.length === 0) return null
  const box = frameBox(points)
  const paddedLon = Math.min(180, box.lonSpan + FRAME_PAD)
  const paddedLat = Math.min(100, box.north - box.south + FRAME_PAD)
  const radiusScale = Math.min(
    FOCUS_RADIUS_SCALE,
    Math.max(1, Math.min(180 / Math.max(paddedLon, 8), 100 / Math.max(paddedLat, 8))),
  )
  const centerLon = wrapLongitude(box.west + box.lonSpan / 2)
  return {
    longitude: centerLon,
    latitude: (box.south + box.north) / 2,
    radiusScale,
  }
}

function pointsFor(codes: string[]): { longitude: number; latitude: number }[] {
  const wanted = new Set(codes)
  const points: { longitude: number; latitude: number }[] = []
  for (const country of BORDERS) {
    if (!wanted.has(country.iso)) continue
    for (const ring of country.rings) {
      for (const pair of ring) {
        const longitude = pair[0]
        const latitude = pair[1]
        if (longitude === undefined || latitude === undefined) continue
        points.push({ longitude, latitude })
      }
    }
  }
  return points
}

function frameBox(points: { longitude: number; latitude: number }[]): {
  west: number
  north: number
  south: number
  lonSpan: number
} {
  const lons = points.map((point) => point.longitude).sort((left, right) => left - right)
  const lats = points.map((point) => point.latitude)
  const south = Math.min(...lats)
  const north = Math.max(...lats)
  const first = lons[0] ?? 0
  if (lons.length === 1) return { west: first, north, south, lonSpan: 0 }
  let bestGap = -1
  let afterGap = 0
  for (let index = 0; index < lons.length; index += 1) {
    const current = lons[index] ?? 0
    const next = index + 1 < lons.length ? (lons[index + 1] ?? 0) : first + 360
    const gap = next - current
    if (gap > bestGap) {
      bestGap = gap
      afterGap = index + 1
    }
  }
  const start = lons[afterGap % lons.length] ?? first
  const endRaw = lons[(afterGap - 1 + lons.length) % lons.length] ?? start
  const end = endRaw < start ? endRaw + 360 : endRaw
  return { west: start, north, south, lonSpan: end - start }
}

function wrapLongitude(longitude: number): number {
  return (((longitude + 180) % 360) + 360) % 360 - 180
}
