import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { countryCodeAt, countryPolygonWkt } from './country-border.ts'

describe('countryCodeAt', () => {
  it('when the point is in Paris, then the country is France', () => {
    assert.equal(countryCodeAt(48.86, 2.35), 'FR')
  })

  it('when the point is in Toronto, then the country is Canada', () => {
    assert.equal(countryCodeAt(43.65, -79.38), 'CA')
  })

  it('when the point is in New York, then the country is not Canada', () => {
    assert.equal(countryCodeAt(40.71, -74.01), 'US')
  })
})

describe('countryPolygonWkt', () => {
  it('when the country is Canada, then the border is a closed polygon', () => {
    const polygon = countryPolygonWkt('CA')
    assert.equal(polygon?.startsWith('MULTIPOLYGON'), true)
    assert.equal(polygon?.includes('now()'), false)
  })

  it('when the country code is unknown, then there is no border', () => {
    assert.equal(countryPolygonWkt('ZZ'), null)
  })
})
