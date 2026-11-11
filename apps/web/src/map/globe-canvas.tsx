import { useEffect, useRef, useState } from 'react'

import { createAtlasGl, type AtlasGl } from './atlas-gl.ts'
import atlasUrl from './atlas.webp'
import reliefUrl from './earth-relief.jpg'
import lightsUrl from './earth-night.jpg'
import type { Article } from '../articles/article.ts'
import { createGlobeSky, type GlobeSky } from './globe-sky.ts'
import {
  FLY_HOME_MS,
  FLY_TO_MS,
  FOCUS_RADIUS_SCALE,
  GLOBE_RESUME_MS,
  GLOBE_SPIN_DEGREES_PER_SECOND,
  easeOutCubic,
  facingBBox,
  focusView,
  frameGlobe,
  homeView,
  pointerInsideGlobe,
  placeBanners,
  project,
  shortestTurn,
  type GlobeView,
  type PlacedBanner,
} from './globe-math.ts'
import { PinBanners } from './pin-banners.tsx'
import { drawCountryHeat } from './country-heat.ts'
import { drawPlaceLabels } from './place-labels.ts'

const PIN_REACH = 14

type Flight = {
  from: GlobeView
  to: GlobeView
  toRotation: number
  started: number
  duration: number
}

type GlobeHome = {
  latitude: number
  longitude: number
  radiusScale: number
}

type GlobeCanvasProps = {
  stories: Article[]
  insetLeft: number
  insetRight: number
  insetBottom: number
  selectedId: string | null
  home: GlobeHome | null
  onSelect: (id: string | null) => void
  onSettle: (box: { west: number; south: number; east: number; north: number }) => void
}

function shade(z: number): number {
  return 0.28 + 0.72 * z
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('image'))
    image.src = url
  })
}

function fitCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }
}

export function GlobeCanvas({ stories, insetLeft, insetRight, insetBottom, selectedId, home, onSelect, onSettle }: GlobeCanvasProps) {
  const skyRef = useRef<HTMLCanvasElement>(null)
  const markRef = useRef<HTMLCanvasElement>(null)
  const atlasRef = useRef<HTMLCanvasElement>(null)
  const storiesRef = useRef(stories)
  const insetRef = useRef({ left: insetLeft, right: insetRight, bottom: insetBottom })
  const viewRef = useRef<GlobeView>({ rotation: 0, latitude: 0, radiusScale: 1 })
  const flightRef = useRef<Flight | null>(null)
  const goalRef = useRef({ id: selectedId, serial: 0 })
  const seenGoalRef = useRef(0)
  const onSelectRef = useRef(onSelect)
  const onSettleRef = useRef(onSettle)
  const homeRef = useRef(home)
  const selectedRef = useRef(selectedId)
  const pointerRef = useRef({ x: 0, y: 0, moved: false })
  const draggingRef = useRef(false)
  const overGlobeRef = useRef(false)
  const globeFrameRef = useRef({ x: 0, y: 0, radius: 0 })
  const lastXRef = useRef(0)
  const resumeAtRef = useRef(0)
  const pinsRef = useRef<{ id: string; x: number; y: number }[]>([])
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const skyDrawRef = useRef<GlobeSky | null>(null)
  const atlasDrawRef = useRef<AtlasGl | null>(null)
  const startedRef = useRef(0)
  const [banners, setBanners] = useState<PlacedBanner[]>([])

  useEffect(() => {
    storiesRef.current = stories
  }, [stories])

  useEffect(() => {
    insetRef.current = { left: insetLeft, right: insetRight, bottom: insetBottom }
  }, [insetLeft, insetRight, insetBottom])

  useEffect(() => {
    onSelectRef.current = onSelect
    onSettleRef.current = onSettle
    selectedRef.current = selectedId
    goalRef.current = { id: selectedId, serial: goalRef.current.serial + 1 }
  }, [onSelect, onSettle, selectedId])

  useEffect(() => {
    homeRef.current = home
    if (!home) return
    viewRef.current.rotation = -home.longitude
    viewRef.current.latitude = home.latitude
    viewRef.current.radiusScale = home.radiusScale
  }, [home])

  useEffect(() => {
    let cancelled = false
    let sky: GlobeSky | null = null
    let atlas: AtlasGl | null = null
    void Promise.all([loadImage(reliefUrl), loadImage(lightsUrl), loadImage(atlasUrl)]).then(([relief, lights, statue]) => {
      if (cancelled) return
      const skyCanvas = skyRef.current
      const atlasCanvas = atlasRef.current
      if (skyCanvas) sky = createGlobeSky(skyCanvas, relief, lights)
      if (atlasCanvas) atlas = createAtlasGl(atlasCanvas, statue)
      skyDrawRef.current = sky
      atlasDrawRef.current = atlas
    })
    return () => {
      cancelled = true
      sky?.dispose()
      atlas?.dispose()
      skyDrawRef.current = null
      atlasDrawRef.current = null
    }
  }, [])

  useEffect(() => {
    const mark = markRef.current
    const skyCanvas = skyRef.current
    const atlasCanvas = atlasRef.current
    if (!mark || !skyCanvas || !atlasCanvas) return
    const context = mark.getContext('2d')
    if (!context) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const offsetHours = -new Date().getTimezoneOffset() / 60
    const place = homeRef.current
    if (place) {
      viewRef.current.rotation = -place.longitude
      viewRef.current.latitude = place.latitude
      viewRef.current.radiusScale = place.radiusScale
    } else {
      viewRef.current.rotation = -Math.max(-150, Math.min(150, offsetHours * 15))
    }
    startedRef.current = performance.now()
    let frame = 0
    let last = performance.now()
    let alive = true

    const draw = (now: number) => {
      if (!alive) return
      const dt = Math.min(50, now - last)
      last = now
      const rect = mark.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const cssWidth = Math.max(1, rect.width)
      const cssHeight = Math.max(1, rect.height)
      const width = Math.floor(cssWidth * dpr)
      const height = Math.floor(cssHeight * dpr)
      fitCanvas(skyCanvas, width, height)
      fitCanvas(mark, width, height)
      fitCanvas(atlasCanvas, width, height)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (goalRef.current.serial !== seenGoalRef.current) {
        seenGoalRef.current = goalRef.current.serial
        const story = storiesRef.current.find((item) => item.id === goalRef.current.id)
        const current = viewRef.current
        const target = story ? focusView(story.longitude, story.latitude) : homeView(current)
        const turned = shortestTurn(current.rotation, target.rotation)
        const same =
          Math.abs(turned - current.rotation) < 0.05 &&
          Math.abs(current.latitude - target.latitude) < 0.05 &&
          Math.abs(current.radiusScale - target.radiusScale) < 0.05
        if (!same) {
          flightRef.current = {
            from: { ...current },
            to: target,
            toRotation: turned,
            started: now,
            duration: reduced ? 0 : story ? FLY_TO_MS : FLY_HOME_MS,
          }
        }
      }
      const flight = flightRef.current
      const focused = goalRef.current.id !== null
      const spinning =
        overGlobeRef.current && !reduced && !draggingRef.current && !focused && !flight && now >= resumeAtRef.current
      if (flight) {
        const t = flight.duration === 0 ? 1 : easeOutCubic((now - flight.started) / flight.duration)
        viewRef.current = {
          rotation: flight.from.rotation + (flight.toRotation - flight.from.rotation) * t,
          latitude: flight.from.latitude + (flight.to.latitude - flight.from.latitude) * t,
          radiusScale: flight.from.radiusScale + (flight.to.radiusScale - flight.from.radiusScale) * t,
        }
        if (t >= 1) flightRef.current = null
      } else if (spinning) {
        viewRef.current.rotation -= (dt / 1000) * GLOBE_SPIN_DEGREES_PER_SECOND
      }
      const inset = insetRef.current
      const framed = frameGlobe(viewRef.current, cssWidth, cssHeight, inset)
      const centerX = framed.centerX
      const centerY = framed.centerY
      const radius = framed.radius
      globeFrameRef.current = { x: centerX, y: centerY, radius }
      const rotation = viewRef.current.rotation
      const time = (now - startedRef.current) / 1000
      context.clearRect(0, 0, cssWidth, cssHeight)
      const sky = skyDrawRef.current
      if (sky) {
        sky.draw({
          centerX,
          centerY,
          radius,
          cssHeight,
          dpr,
          rotation,
          time: reduced ? 0 : time,
        })
      } else {
        context.fillStyle = '#080808'
        context.beginPath()
        context.arc(centerX, centerY, radius, 0, Math.PI * 2)
        context.fill()
      }
      drawCountryHeat(context, storiesRef.current, rotation, centerX, centerY, radius)
      drawPlaceLabels(context, rotation, centerX, centerY, radius)
      const pins = []
      for (const story of storiesRef.current) {
        const point = project(story.latitude, story.longitude, rotation, centerX, centerY, radius)
        if (!point.front) continue
        const color = story.isBreaking ? '#ff4a3d' : '#f2f2f2'
        if (story.isBreaking) {
          const glow = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, 34)
          glow.addColorStop(0, 'rgba(255,74,61,0.7)')
          glow.addColorStop(0.45, 'rgba(255,74,61,0.22)')
          glow.addColorStop(1, 'rgba(255,74,61,0)')
          context.globalAlpha = shade(point.z)
          context.fillStyle = glow
          context.beginPath()
          context.arc(point.x, point.y, 34, 0, Math.PI * 2)
          context.fill()
        }
        context.globalAlpha = 0.35 * shade(point.z)
        context.fillStyle = color
        context.beginPath()
        context.arc(point.x, point.y, 12, 0, Math.PI * 2)
        context.fill()
        context.globalAlpha = 1
        context.beginPath()
        context.arc(point.x, point.y, 3.4, 0, Math.PI * 2)
        context.fill()
        if (story.id === selectedRef.current) {
          context.strokeStyle = '#f2f2f2'
          context.lineWidth = 1.6
          context.beginPath()
          context.arc(point.x, point.y, 9, 0, Math.PI * 2)
          context.stroke()
        }
        pins.push({ id: story.id, x: point.x, y: point.y, breaking: story.isBreaking })
      }
      pinsRef.current = pins
      context.globalAlpha = 1
      const atlas = atlasDrawRef.current
      if (atlas) {
        atlas.draw({
          centerX,
          centerY,
          radius,
          cssWidth,
          cssHeight,
          dpr,
          time,
          mouseX: mouseRef.current.x,
          mouseY: mouseRef.current.y,
          reduced,
          opacity: Math.max(0, 1 - (viewRef.current.radiusScale - 1) / (FOCUS_RADIUS_SCALE - 1)),
        })
      }
      setBanners(
        placeBanners(pins, {
          width: cssWidth,
          height: cssHeight,
          insetLeft: inset.left,
          insetRight: inset.right,
          insetBottom: inset.bottom,
        }),
      )
      frame = requestAnimationFrame(draw)
    }

    frame = requestAnimationFrame(draw)
    return () => {
      alive = false
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="absolute inset-0">
      <canvas ref={skyRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      <canvas
        ref={markRef}
        className="absolute inset-0 h-full w-full touch-none"
        aria-label="Revolving globe"
        onPointerDown={(event) => {
          const point = pointerPoint(event.currentTarget, event.clientX, event.clientY)
          if (!insideGlobe(point, globeFrameRef.current)) return
          draggingRef.current = true
          pointerRef.current = { x: event.clientX, y: event.clientY, moved: false }
          lastXRef.current = event.clientX
          resumeAtRef.current = Number.POSITIVE_INFINITY
          event.currentTarget.style.cursor = 'grabbing'
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          const point = pointerPoint(event.currentTarget, event.clientX, event.clientY)
          const onGlobe = insideGlobe(point, globeFrameRef.current)
          overGlobeRef.current = onGlobe
          mouseRef.current = onGlobe ? point : { x: -10_000, y: -10_000 }
          const onPin = onGlobe && pinsRef.current.some((pin) => Math.hypot(pin.x - point.x, pin.y - point.y) <= PIN_REACH)
          event.currentTarget.style.cursor = draggingRef.current ? 'grabbing' : onPin ? 'pointer' : onGlobe ? 'grab' : 'default'
          if (!draggingRef.current || !onGlobe) return
          if (Math.hypot(event.clientX - pointerRef.current.x, event.clientY - pointerRef.current.y) > 6) {
            pointerRef.current.moved = true
            flightRef.current = null
          }
          const delta = event.clientX - lastXRef.current
          lastXRef.current = event.clientX
          viewRef.current.rotation -= delta * 0.35
        }}
        onPointerLeave={() => {
          overGlobeRef.current = false
          mouseRef.current = { x: -10_000, y: -10_000 }
        }}
        onPointerUp={(event) => {
          if (!draggingRef.current) return
          const moved = pointerRef.current.moved
          draggingRef.current = false
          resumeAtRef.current = performance.now() + GLOBE_RESUME_MS
          const point = pointerPoint(event.currentTarget, event.clientX, event.clientY)
          event.currentTarget.style.cursor = insideGlobe(point, globeFrameRef.current) ? 'grab' : 'default'
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }
          if (moved) {
            onSettleRef.current(facingBBox(viewRef.current))
            return
          }
          const hit = pinsRef.current.find((pin) => Math.hypot(pin.x - point.x, pin.y - point.y) <= PIN_REACH)
          onSelectRef.current(hit?.id ?? null)
        }}
      />
      <canvas ref={atlasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      <PinBanners stories={stories} placed={banners} onSelect={onSelect} />
    </div>
  )
}

function pointerPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect()
  return { x: clientX - rect.left, y: clientY - rect.top }
}

function insideGlobe(point: { x: number; y: number }, frame: { x: number; y: number; radius: number }) {
  return pointerInsideGlobe(point.x, point.y, frame.x, frame.y, frame.radius)
}
