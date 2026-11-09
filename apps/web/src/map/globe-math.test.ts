import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { facingBBox, focusView, frameGlobe, homeView, placeBanners, project } from './globe-math.ts'

describe('facingBBox', () => {
  it('when the globe faces the prime meridian, then the box is centered on that meridian', () => {
    const box = facingBBox({ rotation: 0, latitude: 0, radiusScale: 1 })
    assert.equal(box.west, -90)
    assert.equal(box.east, 90)
    assert.equal(box.south, -50)
    assert.equal(box.north, 50)
  })
})

describe('project', () => {
  it('when a point faces the camera, then it sits in front of the globe', () => {
    const point = project(0, 0, 0, 200, 200, 100)
    assert.equal(point.front, true)
    assert.ok(Math.abs(point.x - 200) < 1)
  })

  it('when a point is on the far side, then it stays hidden', () => {
    const point = project(0, 180, 0, 200, 200, 100)
    assert.equal(point.front, false)
  })
})

describe('focusView', () => {
  it('when a story is selected, then the globe faces that longitude', () => {
    const view = focusView(-74, 40.7)
    assert.equal(view.rotation, 74)
    assert.equal(view.latitude, 40.7)
    assert.ok(view.radiusScale > 1)
  })

  it('when the detail closes, then the globe returns to the fitted size', () => {
    const view = homeView(focusView(-74, 40.7))
    assert.equal(view.radiusScale, 1)
    assert.equal(view.latitude, 0)
    assert.equal(view.rotation, 74)
  })

  it('when the globe focuses a story, then that place sits in the middle of the open map', () => {
    const view = focusView(-74, 40.7)
    const frame = frameGlobe(view, 1440, 900, { left: 400, right: 460, bottom: 196 })
    const point = project(40.7, -74, view.rotation, frame.centerX, frame.centerY, frame.radius)
    const focusX = 400 + (1440 - 400 - 460) / 2
    const focusY = (900 - 196) / 2
    assert.ok(Math.abs(point.x - focusX) < 1)
    assert.ok(Math.abs(point.y - focusY) < 1)
  })
})

describe('placeBanners', () => {
  const frame = { width: 1200, height: 800, insetLeft: 40, insetRight: 0, insetBottom: 160 }

  it('when a pin sits in the open globe, then a banner is placed beside it', () => {
    const placed = placeBanners([{ id: 'story', x: 640, y: 360, breaking: true }], frame)
    assert.equal(placed.length, 1)
    assert.equal(placed[0]?.id, 'story')
    assert.ok(placed[0] && placed[0].left > placed[0].pinX)
  })

  it('when a pin sits under the country list, then it gets no banner', () => {
    const placed = placeBanners([{ id: 'story', x: 48, y: 360, breaking: true }], frame)
    assert.equal(placed.length, 0)
  })

  it('when two pins would stack their banners, then the second banner moves clear', () => {
    const placed = placeBanners(
      [
        { id: 'first', x: 640, y: 360, breaking: true },
        { id: 'second', x: 670, y: 380, breaking: false },
      ],
      frame,
    )
    assert.equal(placed.length, 2)
    const first = placed[0]
    const second = placed[1]
    assert.ok(first && second)
    const overlaps =
      first.left < second.left + 210 &&
      first.left + 210 > second.left &&
      first.top < second.top + 40 &&
      first.top + 40 > second.top
    assert.equal(overlaps, false)
  })

  it('when more than ten pins fit, then the map shows ten banners', () => {
    const pin = (id: string, x: number, y: number) => ({ id, x, y, breaking: false })
    const placed = placeBanners(
      [
        pin('a', 180, 180),
        pin('b', 430, 180),
        pin('c', 680, 180),
        pin('d', 930, 180),
        pin('e', 180, 380),
        pin('f', 430, 380),
        pin('g', 680, 380),
        pin('h', 930, 380),
        pin('i', 180, 560),
        pin('j', 430, 560),
        pin('k', 680, 560),
      ],
      frame,
    )
    assert.equal(placed.length, 10)
  })
})
