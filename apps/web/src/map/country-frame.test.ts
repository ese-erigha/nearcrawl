import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { countryFocus } from './country-frame.ts'

describe('countryFocus', () => {
  it('when the set is Canada, then the frame sits in Canada', () => {
    const focus = countryFocus(['CA'])
    assert.ok(focus)
    assert.ok(focus.latitude > 40)
    assert.ok(focus.longitude < -50)
  })

  it('when the set adds Japan, then the frame zooms out from Japan alone', () => {
    const japan = countryFocus(['JP'])
    const both = countryFocus(['CA', 'JP'])
    assert.ok(japan)
    assert.ok(both)
    assert.ok(both.radiusScale < japan.radiusScale)
  })

  it('when the code is unknown, then there is no frame', () => {
    assert.equal(countryFocus(['ZZ']), null)
    assert.equal(countryFocus([]), null)
  })
})
