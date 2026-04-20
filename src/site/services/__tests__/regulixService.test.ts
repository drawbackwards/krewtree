import { describe, it, expect } from 'vitest'
import {
  getRegulixStatus,
  getEndorsements,
  getVerifiedWorkHistory,
  getPastHires,
} from '../regulixService'

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

describe('getVerifiedWorkHistory', () => {
  it('returns verified entries for a worker, newest first', async () => {
    const { data, error } = await getVerifiedWorkHistory('w1')
    expect(error).toBeNull()
    expect(data).toHaveLength(2)
    expect(data.every((e) => e.verified === true)).toBe(true)
    // Newest first: the entry with endDate=null (current) should come first
    expect(data[0].endDate).toBeNull()
  })

  it('returns empty for a worker with no verified history', async () => {
    const { data, error } = await getVerifiedWorkHistory('w99')
    expect(error).toBeNull()
    expect(data).toEqual([])
  })
})

describe('getPastHires', () => {
  it('returns past hires for a company', async () => {
    const { data, error } = await getPastHires('c1')
    expect(error).toBeNull()
    expect(data.length).toBeGreaterThan(0)
    expect(data.every((p) => p.companyId === 'c1')).toBe(true)
  })

  it('returns empty for a company with no past hires', async () => {
    const { data, error } = await getPastHires('c-unknown')
    expect(error).toBeNull()
    expect(data).toEqual([])
  })
})
