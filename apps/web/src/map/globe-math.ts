export const GLOBE_SPIN_DEGREES_PER_SECOND = 2.2
export const GLOBE_RESUME_MS = 4_000
export const FOCUS_RADIUS_SCALE = 2.15
export const FLY_TO_MS = 2_600
export const FLY_HOME_MS = 1_800
export const DETAIL_PANEL_WIDTH = 440
export const DETAIL_MAP_INSET = 460

export type ProjectedPoint = {
  x: number
  y: number
  z: number
  front: boolean
}

export function project(
  latitude: number,
  longitude: number,
  rotation: number,
  centerX: number,
  centerY: number,
  radius: number,
): ProjectedPoint {
  const phi = (latitude * Math.PI) / 180
  const theta = ((longitude + rotation) * Math.PI) / 180
  const x = Math.cos(phi) * Math.sin(theta)
  const y = Math.sin(phi)
  const z = Math.cos(phi) * Math.cos(theta)
  return {
    x: centerX + x * radius,
    y: centerY - y * radius,
    z,
    front: z > 0.08,
  }
}

export const BANNER_LIMIT = 10
export const BANNER_WIDTH = 210
export const BANNER_HEIGHT = 40

export type PinPoint = {
  id: string
  x: number
  y: number
  breaking: boolean
}

export type PlacedBanner = {
  id: string
  pinX: number
  pinY: number
  left: number
  top: number
  side: 'left' | 'right'
}

export type GlobeView = {
  rotation: number
  latitude: number
  radiusScale: number
}

export type GlobeInsets = {
  left: number
  right: number
  bottom: number
}

export function easeOutCubic(amount: number): number {
  const t = Math.max(0, Math.min(1, amount))
  return 1 - (1 - t) ** 3
}

export function shortestTurn(from: number, to: number): number {
  const delta = ((to - from + 540) % 360) - 180
  return from + delta
}

export function focusView(longitude: number, latitude: number): GlobeView {
  return { rotation: -longitude, latitude, radiusScale: FOCUS_RADIUS_SCALE }
}

export function facingBBox(view: GlobeView): { west: number; south: number; east: number; north: number } {
  const scale = Math.max(view.radiusScale, 1)
  const halfLon = 90 / scale
  const halfLat = 50 / scale
  const centerLon = wrapLongitude(-view.rotation)
  return {
    west: wrapLongitude(centerLon - halfLon),
    south: Math.max(-90, view.latitude - halfLat),
    east: wrapLongitude(centerLon + halfLon),
    north: Math.min(90, view.latitude + halfLat),
  }
}

function wrapLongitude(longitude: number): number {
  return (((longitude + 180) % 360) + 360) % 360 - 180
}

export function homeView(current: GlobeView): GlobeView {
  return { rotation: current.rotation, latitude: 0, radiusScale: 1 }
}

export function pointerInsideGlobe(x: number, y: number, centerX: number, centerY: number, radius: number): boolean {
  return Math.hypot(x - centerX, y - centerY) <= radius
}

export function frameGlobe(
  view: GlobeView,
  width: number,
  height: number,
  inset: GlobeInsets,
): { centerX: number; centerY: number; radius: number } {
  const freeWidth = Math.max(120, width - inset.left - inset.right)
  const freeHeight = Math.max(120, height - inset.bottom)
  const radius = Math.min(freeWidth, freeHeight) * 0.48 * view.radiusScale
  const lift = Math.sin((view.latitude * Math.PI) / 180) * radius
  return {
    centerX: inset.left + freeWidth / 2,
    centerY: freeHeight / 2 + lift,
    radius,
  }
}

type BannerFrame = {
  width: number
  height: number
  insetLeft: number
  insetRight: number
  insetBottom: number
}

export function placeBanners(pins: PinPoint[], frame: BannerFrame): PlacedBanner[] {
  const ordered = [...pins].sort((a, b) => Number(b.breaking) - Number(a.breaking))
  const placed: PlacedBanner[] = []
  const boxes: { x: number; y: number; w: number; h: number }[] = []
  const right = frame.width - frame.insetRight - 12
  const bottom = frame.height - frame.insetBottom - 8

  for (const pin of ordered) {
    if (placed.length >= BANNER_LIMIT) break
    if (pin.x < frame.insetLeft + 28 || pin.x > frame.width - 28) continue
    if (pin.y < 72 || pin.y > bottom - 16) continue
    const options = [
      { left: pin.x + 34, top: pin.y - 58, side: 'right' as const },
      { left: pin.x - 34 - BANNER_WIDTH, top: pin.y - 58, side: 'left' as const },
      { left: pin.x + 34, top: pin.y + 18, side: 'right' as const },
      { left: pin.x - 34 - BANNER_WIDTH, top: pin.y + 18, side: 'left' as const },
    ]
    const fit = options.find((option) => {
      if (option.left < frame.insetLeft + 8 || option.left + BANNER_WIDTH > right) return false
      if (option.top < 64 || option.top + BANNER_HEIGHT > bottom) return false
      const coversPin = ordered.some(
        (other) =>
          other.x > option.left - 8 &&
          other.x < option.left + BANNER_WIDTH + 8 &&
          other.y > option.top - 8 &&
          other.y < option.top + BANNER_HEIGHT + 8,
      )
      if (coversPin) return false
      return !boxes.some(
        (box) =>
          option.left < box.x + box.w + 8 &&
          option.left + BANNER_WIDTH + 8 > box.x &&
          option.top < box.y + box.h + 8 &&
          option.top + BANNER_HEIGHT + 8 > box.y,
      )
    })
    if (!fit) continue
    boxes.push({ x: fit.left, y: fit.top, w: BANNER_WIDTH, h: BANNER_HEIGHT })
    placed.push({
      id: pin.id,
      pinX: pin.x,
      pinY: pin.y,
      left: fit.left,
      top: fit.top,
      side: fit.side,
    })
  }
  return placed
}
