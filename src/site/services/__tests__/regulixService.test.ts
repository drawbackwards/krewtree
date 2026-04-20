import { describe, it, expect } from 'vitest'
import { getRegulixStatus } from '../regulixService'

describe('getRegulixStatus', () => {
  it('returns the status for a worker with a Regulix account', async () => {
    const { data, error } = await getRegulixStatus('w1')
    expect(error).toBeNull()
    expect(data).toEqual({ ready: true, onboarded: true, immediateHire: true })
  })

  it('returns null data for an unknown worker', async () => {
    const { data, error } = await getRegulixStatus('does-not-exist')
    expect(error).toBeNull()
    expect(data).toBeNull()
  })
})
