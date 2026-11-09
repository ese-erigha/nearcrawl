import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { briefMapSvg } from './brief-map.ts'

describe('briefMapSvg', () => {
  it('when a breaking story sits in Japan, then the map draws a red pin', () => {
    const svg = briefMapSvg([{ latitude: 35.68, longitude: 139.76, isBreaking: true }])
    assert.match(svg, /fill="#ff4a3d"/)
    assert.match(svg, /fill="#2a3341"/)
  })

  it('when a story is also hot, then the map draws a hollow pin', () => {
    const svg = briefMapSvg([{ latitude: 34.65, longitude: 135.39, isBreaking: false }])
    assert.match(svg, /stroke="#dedede"/)
    assert.doesNotMatch(svg, /fill="#ff4a3d"/)
  })
})
