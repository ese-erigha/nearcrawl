import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { service } from './service.ts'

describe('ingestion', () => {
  it('when the service loads, then the interval and the retention come from wrangler', () => {
    assert.equal(service.name, 'ingestion')
    assert.equal(Number.isInteger(service.intervalMinutes), true)
    assert.equal(service.intervalMinutes > 0, true)
    assert.equal(Number.isInteger(service.retentionDays), true)
    assert.equal(service.retentionDays > 0, true)
  })
})
