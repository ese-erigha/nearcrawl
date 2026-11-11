import type { Article } from '../articles/article.ts'
import rawBorders from '../../../../packages/db/src/country-borders.json' with { type: 'json' }
import { project } from './globe-math.ts'

// Natural Earth 110m admin-0 countries. Public domain.
// Same heat as Global Hack Map: a red fill and a red hairline, stronger where more stories sit.

const FILL_COLOR = '#ff4a3d'
const LINE_COLOR = '#ff6a5c'
const FILL_BASE = 0.03
const FILL_RANGE = 0.09
const LINE_BASE = 0.3
const LINE_RANGE = 0.5
const LINE_WIDTH = 0.8

type Ring = [number, number][]

type CountryBorder = {
  iso: string
  rings: Ring[]
}

const BORDERS = rawBorders as CountryBorder[]

export function countryHeatOpacity(count: number, max: number, base: number, range: number): number {
  if (count <= 0 || max <= 0) return 0
  return Number((base + range * Math.sqrt(count / max)).toFixed(3))
}

function countsByCountry(stories: Article[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const story of stories) {
    for (const code of story.countryCodes) {
      counts.set(code, (counts.get(code) ?? 0) + 1)
    }
  }
  return counts
}

function ringFacesCamera(ring: Ring, rotation: number, centerX: number, centerY: number, radius: number): boolean {
  for (const [longitude, latitude] of ring) {
    const point = project(latitude, longitude, rotation, centerX, centerY, radius)
    if (point.z <= 0.12) return false
  }
  return true
}

function fillRing(context: CanvasRenderingContext2D, ring: Ring, rotation: number, centerX: number, centerY: number, radius: number) {
  const [firstLongitude, firstLatitude] = ring[0]
  const first = project(firstLatitude, firstLongitude, rotation, centerX, centerY, radius)
  context.beginPath()
  context.moveTo(first.x, first.y)
  for (let index = 1; index < ring.length; index += 1) {
    const [longitude, latitude] = ring[index]
    const point = project(latitude, longitude, rotation, centerX, centerY, radius)
    context.lineTo(point.x, point.y)
  }
  context.closePath()
  context.fill()
}

function strokeRing(context: CanvasRenderingContext2D, ring: Ring, rotation: number, centerX: number, centerY: number, radius: number) {
  context.beginPath()
  let previous: { x: number; y: number; z: number } | null = null
  for (const [longitude, latitude] of ring) {
    const point = project(latitude, longitude, rotation, centerX, centerY, radius)
    const visible = point.z > 0.02
    const jumped = previous !== null && Math.hypot(point.x - previous.x, point.y - previous.y) > radius * 0.45
    if (!visible || previous === null || previous.z <= 0.02 || jumped) {
      if (visible) context.moveTo(point.x, point.y)
    } else {
      context.lineTo(point.x, point.y)
    }
    previous = point
  }
  context.stroke()
}

export function drawCountryHeat(
  context: CanvasRenderingContext2D,
  stories: Article[],
  rotation: number,
  centerX: number,
  centerY: number,
  radius: number,
) {
  const counts = countsByCountry(stories)
  let max = 0
  for (const count of counts.values()) max = Math.max(max, count)
  if (max === 0) return

  context.save()
  context.beginPath()
  context.arc(centerX, centerY, radius, 0, Math.PI * 2)
  context.clip()
  context.lineJoin = 'round'
  context.lineCap = 'round'
  context.lineWidth = LINE_WIDTH

  for (const country of BORDERS) {
    const count = counts.get(country.iso) ?? 0
    if (count === 0) continue
    context.fillStyle = FILL_COLOR
    context.strokeStyle = LINE_COLOR
    for (const ring of country.rings) {
      context.globalAlpha = countryHeatOpacity(count, max, FILL_BASE, FILL_RANGE)
      if (ringFacesCamera(ring, rotation, centerX, centerY, radius)) {
        fillRing(context, ring, rotation, centerX, centerY, radius)
      }
      context.globalAlpha = countryHeatOpacity(count, max, LINE_BASE, LINE_RANGE)
      strokeRing(context, ring, rotation, centerX, centerY, radius)
    }
  }

  context.restore()
}
