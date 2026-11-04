import { project } from './globe-math.ts'

const LABEL_KIND = {
  COUNTRY: 'country',
  REGION: 'region',
  OCEAN: 'ocean',
} as const

type LabelKind = (typeof LABEL_KIND)[keyof typeof LABEL_KIND]

type PlaceLabel = {
  name: string
  latitude: number
  longitude: number
  kind: LabelKind
}

const PLACES: PlaceLabel[] = [
  { name: 'North America', latitude: 48, longitude: -100, kind: LABEL_KIND.REGION },
  { name: 'South America', latitude: -16, longitude: -60, kind: LABEL_KIND.REGION },
  { name: 'Europe', latitude: 51, longitude: 12, kind: LABEL_KIND.REGION },
  { name: 'Africa', latitude: 4, longitude: 18, kind: LABEL_KIND.REGION },
  { name: 'Asia', latitude: 48, longitude: 88, kind: LABEL_KIND.REGION },
  { name: 'Canada', latitude: 58, longitude: -96, kind: LABEL_KIND.COUNTRY },
  { name: 'United States', latitude: 39, longitude: -98, kind: LABEL_KIND.COUNTRY },
  { name: 'Mexico', latitude: 24, longitude: -102, kind: LABEL_KIND.COUNTRY },
  { name: 'Greenland', latitude: 74, longitude: -42, kind: LABEL_KIND.COUNTRY },
  { name: 'Brazil', latitude: -10, longitude: -52, kind: LABEL_KIND.COUNTRY },
  { name: 'Argentina', latitude: -36, longitude: -64, kind: LABEL_KIND.COUNTRY },
  { name: 'Colombia', latitude: 4, longitude: -72, kind: LABEL_KIND.COUNTRY },
  { name: 'United Kingdom', latitude: 54, longitude: -2, kind: LABEL_KIND.COUNTRY },
  { name: 'France', latitude: 47, longitude: 2, kind: LABEL_KIND.COUNTRY },
  { name: 'Germany', latitude: 51, longitude: 10, kind: LABEL_KIND.COUNTRY },
  { name: 'Spain', latitude: 40, longitude: -4, kind: LABEL_KIND.COUNTRY },
  { name: 'Italy', latitude: 43, longitude: 12, kind: LABEL_KIND.COUNTRY },
  { name: 'Norway', latitude: 64, longitude: 12, kind: LABEL_KIND.COUNTRY },
  { name: 'Sweden', latitude: 63, longitude: 16, kind: LABEL_KIND.COUNTRY },
  { name: 'Poland', latitude: 52, longitude: 19, kind: LABEL_KIND.COUNTRY },
  { name: 'Ukraine', latitude: 49, longitude: 32, kind: LABEL_KIND.COUNTRY },
  { name: 'Turkey', latitude: 39, longitude: 35, kind: LABEL_KIND.COUNTRY },
  { name: 'Nigeria', latitude: 9, longitude: 8, kind: LABEL_KIND.COUNTRY },
  { name: 'Egypt', latitude: 26, longitude: 30, kind: LABEL_KIND.COUNTRY },
  { name: 'Algeria', latitude: 28, longitude: 2, kind: LABEL_KIND.COUNTRY },
  { name: 'South Africa', latitude: -29, longitude: 24, kind: LABEL_KIND.COUNTRY },
  { name: 'Kenya', latitude: 0, longitude: 38, kind: LABEL_KIND.COUNTRY },
  { name: 'Russia', latitude: 62, longitude: 95, kind: LABEL_KIND.COUNTRY },
  { name: 'China', latitude: 35, longitude: 104, kind: LABEL_KIND.COUNTRY },
  { name: 'India', latitude: 22, longitude: 79, kind: LABEL_KIND.COUNTRY },
  { name: 'Japan', latitude: 37, longitude: 138, kind: LABEL_KIND.COUNTRY },
  { name: 'Mongolia', latitude: 46, longitude: 103, kind: LABEL_KIND.COUNTRY },
  { name: 'Kazakhstan', latitude: 48, longitude: 67, kind: LABEL_KIND.COUNTRY },
  { name: 'Iran', latitude: 32, longitude: 53, kind: LABEL_KIND.COUNTRY },
  { name: 'Saudi Arabia', latitude: 24, longitude: 45, kind: LABEL_KIND.COUNTRY },
  { name: 'Indonesia', latitude: -2, longitude: 118, kind: LABEL_KIND.COUNTRY },
  { name: 'Australia', latitude: -25, longitude: 134, kind: LABEL_KIND.COUNTRY },
  { name: 'North Atlantic Ocean', latitude: 35, longitude: -40, kind: LABEL_KIND.OCEAN },
  { name: 'North Pacific Ocean', latitude: 28, longitude: -160, kind: LABEL_KIND.OCEAN },
  { name: 'Indian Ocean', latitude: -20, longitude: 80, kind: LABEL_KIND.OCEAN },
]

type Box = { x: number; y: number; w: number; h: number }

function overlaps(box: Box, boxes: Box[]): boolean {
  return boxes.some(
    (other) => box.x < other.x + other.w + 10 && box.x + box.w + 10 > other.x && box.y < other.y + other.h + 8 && box.y + box.h + 8 > other.y,
  )
}

export function drawPlaceLabels(
  context: CanvasRenderingContext2D,
  rotation: number,
  centerX: number,
  centerY: number,
  radius: number,
) {
  const boxes: Box[] = []
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.lineJoin = 'round'

  for (const place of PLACES) {
    const point = project(place.latitude, place.longitude, rotation, centerX, centerY, radius)
    if (point.z < 0.46) continue
    const size = place.kind === LABEL_KIND.COUNTRY ? 12 : 11
    const text = place.kind === LABEL_KIND.COUNTRY ? place.name : place.name.toUpperCase()
    context.font = `500 ${size}px "Mona Sans", sans-serif`
    context.letterSpacing = place.kind === LABEL_KIND.COUNTRY ? '0.2px' : '1.2px'
    const width = context.measureText(text).width
    const box = { x: point.x - width / 2, y: point.y - size / 2, w: width, h: size }
    if (overlaps(box, boxes)) continue
    boxes.push(box)
    context.globalAlpha = 1
    context.lineWidth = 2
    context.strokeStyle = 'rgba(8,8,8,0.72)'
    context.strokeText(text, point.x, point.y)
    context.fillStyle = place.kind === LABEL_KIND.OCEAN ? '#d6d6d6' : '#e4e4e4'
    context.fillText(text, point.x, point.y)
  }

  context.letterSpacing = '0px'
  context.globalAlpha = 1
}
