import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { countryHeatOpacity } from './country-heat.ts'

describe('countryHeatOpacity', () => {
  it('when a country has the most stories, then the heat line reaches the top of the range', () => {
    assert.equal(countryHeatOpacity(5, 5, 0.3, 0.5), 0.8)
  })

  it('when a country has no stories, then the heat stays off', () => {
    assert.equal(countryHeatOpacity(0, 5, 0.03, 0.09), 0)
  })

  it('when a country has fewer stories, then the heat follows the square root of its share', () => {
    assert.equal(countryHeatOpacity(1, 5, 0.3, 0.5), 0.524)
  })
})
