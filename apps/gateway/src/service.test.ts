import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { service, spatialNewsPath } from './service.ts'

describe('gateway', () => {
  it('builds the bounding-box news path', () => {
    assert.equal(service.name, 'gateway')
    assert.equal(
      spatialNewsPath('-10,-20,10,30'),
      '/api/spatial/news?bbox=-10%2C-20%2C10%2C30',
    )
  })
})
