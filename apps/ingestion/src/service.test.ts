import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { service } from './service.ts'

describe('ingestion', () => {
  it('pulls on a 10 minute interval and keeps a 14 day feed', () => {
    assert.equal(service.name, 'ingestion')
    assert.equal(service.intervalMinutes, 10)
    assert.equal(service.retentionDays, 14)
  })
})
