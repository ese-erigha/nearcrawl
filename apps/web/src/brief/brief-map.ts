import landDots from './land-dots.json' with { type: 'json' }

const WIDTH = 1200
const HEIGHT = 520
const SCALE = 3.3
const CENTER_LON = 12
const TOP_LAT = 81 + 18 / SCALE
const DOT = '#2a3341'
const DOT_RADIUS = 2.1
const PIN_RADIUS = 6
const PIN_GAP = PIN_RADIUS * 2.35
const BREAKING = '#ff4a3d'
const ALSO_HOT = '#dedede'

const DOTS = landDots as [number, number][]

export type BriefPin = {
  latitude: number
  longitude: number
  isBreaking: boolean
}

export function briefMapSvg(pins: BriefPin[]): string {
  const circles = DOTS.map(([lon, lat]) => {
    const [x, y] = project(lon, lat)
    if (x < -DOT_RADIUS || y < -DOT_RADIUS || x > WIDTH + DOT_RADIUS || y > HEIGHT + DOT_RADIUS) return ''
    return `<circle cx="${round(x)}" cy="${round(y)}" r="${DOT_RADIUS}" fill="${DOT}"/>`
  }).join('')
  const markers = pack(pins)
    .map((pin) => pinShape(pin.x, pin.y, pin.isBreaking))
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">${circles}${markers}</svg>`
}

function project(lon: number, lat: number): [number, number] {
  const delta = ((((lon - CENTER_LON) % 360) + 540) % 360) - 180
  return [WIDTH / 2 + delta * SCALE, (TOP_LAT - lat) * SCALE]
}

function pack(pins: BriefPin[]): { x: number; y: number; isBreaking: boolean }[] {
  const placed: { x: number; y: number }[] = []
  return pins.map((pin) => {
    const [originX, originY] = project(pin.longitude, pin.latitude)
    let x = originX
    let y = originY
    let spin = 0
    while (placed.some((other) => Math.hypot(other.x - x, other.y - y) < PIN_GAP) && spin < 12) {
      const radius = PIN_GAP * Math.sqrt(spin + 1)
      x = originX + Math.cos(spin * 2.399) * radius
      y = originY + Math.sin(spin * 2.399) * radius
      spin += 1
    }
    placed.push({ x, y })
    return { x, y, isBreaking: pin.isBreaking }
  })
}

function pinShape(x: number, y: number, isBreaking: boolean): string {
  const cx = round(x)
  const cy = round(y)
  if (isBreaking) return `<circle cx="${cx}" cy="${cy}" r="${PIN_RADIUS}" fill="${BREAKING}"/>`
  const inner = round(PIN_RADIUS - 1.1)
  return `<circle cx="${cx}" cy="${cy}" r="${inner}" fill="none" stroke="${ALSO_HOT}" stroke-width="1.5"/>`
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}
