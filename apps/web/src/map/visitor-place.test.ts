import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { countryAt } from './visitor-place.ts'

describe('countryAt', () => {
  it('when the point is in Tokyo, then the country is Japan', () => {
    assert.equal(countryAt(35.68, 139.69)?.code, 'JP')
  })

  it('when the point is in the ocean, then no country matches', () => {
    assert.equal(countryAt(0, -30), null)
  })
})
