import { describe, it, expect } from 'vitest'
import { getRegulixStatus, getEndorsements } from '../regulixService'

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

describe('getEndorsements', () => {
  it('returns endorsements for a worker who has them', async () => {
    const { data, error } = await getEndorsements('w1')
    expect(error).toBeNull()
    expect(data).toHaveLength(2)
    expect(data[0]).toMatchObject({
      workerId: 'w1',
      fromCompanyName: expect.any(String),
      rating: expect.any(Number),
    })
  })

  it('returns an empty array for a worker with no endorsements', async () => {
    const { data, error } = await getEndorsements('w99')
    expect(error).toBeNull()
    expect(data).toEqual([])
  })
})
