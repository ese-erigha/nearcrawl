import rawBorders from './country-borders.json' with { type: 'json' }

type Ring = [number, number][]

type CountryBorder = {
  iso: string
  rings: Ring[]
}

const BORDERS = rawBorders as CountryBorder[]

export function countryCodeAt(latitude: number, longitude: number): string | null {
  const border = BORDERS.find(
    (country) => country.iso.length === 2 && country.rings.some((ring) => ringContains(ring, longitude, latitude)),
  )
  return border?.iso ?? null
}

export function countryPolygonWkt(code: string): string | null {
  const border = BORDERS.find((country) => country.iso === code)
  if (!border) return null
  const polygons = border.rings
    .map(closedRing)
    .filter((ring) => ring.length >= 4)
    .map((ring) => `((${ring.map(([longitude, latitude]) => `${longitude} ${latitude}`).join(',')}))`)
  const first = polygons[0]
  if (!first) return null
  if (polygons.length === 1) return `POLYGON${first}`
  return `MULTIPOLYGON(${polygons.join(',')})`
}

function closedRing(ring: Ring): Ring {
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (!first || !last) return []
  if (first[0] === last[0] && first[1] === last[1]) return ring
  return [...ring, first]
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
