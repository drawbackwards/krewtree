import { describe, it, expect } from 'vitest'
import {
  getRegulixStatus,
  getEndorsements,
  getVerifiedWorkHistory,
  getPastHires,
  hasRegulixAccount,
  submitHireHandoff,
  linkCompanyAccount,
  inviteWorker,
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

describe('hasRegulixAccount', () => {
  it('returns true for a worker on Regulix', async () => {
    const { data, error } = await hasRegulixAccount('w1')
    expect(error).toBeNull()
    expect(data).toBe(true)
  })

  it('returns false for a krewtree-only worker', async () => {
    const { data, error } = await hasRegulixAccount('w4')
    expect(error).toBeNull()
    expect(data).toBe(false)
  })

  it('returns false for an unknown worker', async () => {
    const { data, error } = await hasRegulixAccount('w99')
    expect(error).toBeNull()
    expect(data).toBe(false)
  })
})

describe('submitHireHandoff', () => {
  it('returns a generated regulixHireId on success', async () => {
    const { data, error } = await submitHireHandoff({
      companyId: 'c1',
      workerId: 'w1',
      jobId: 'j1',
      hireDate: '2026-04-21',
      payRate: 32,
    })
    expect(error).toBeNull()
    expect(data?.regulixHireId).toMatch(/^mock-hire-/)
  })

  it('generates a unique id per call', async () => {
    const params = {
      companyId: 'c1',
      workerId: 'w1',
      jobId: 'j1',
      hireDate: '2026-04-21',
      payRate: 32,
    }
    const a = await submitHireHandoff(params)
    const b = await submitHireHandoff(params)
    expect(a.data?.regulixHireId).not.toBe(b.data?.regulixHireId)
  })
})

describe('linkCompanyAccount', () => {
  it('returns success for valid company ids', async () => {
    const { error } = await linkCompanyAccount('c1', 'regulix-company-123')
    expect(error).toBeNull()
  })

  it('returns an error when companyId is empty', async () => {
    const { error } = await linkCompanyAccount('', 'regulix-company-123')
    expect(error).toBe('companyId is required')
  })

  it('returns an error when regulixCompanyId is empty', async () => {
    const { error } = await linkCompanyAccount('c1', '')
    expect(error).toBe('regulixCompanyId is required')
  })
})

describe('inviteWorker', () => {
  it('returns success when the worker has a Regulix account', async () => {
    const { error } = await inviteWorker({
      companyId: 'c1',
      workerId: 'w1',
      jobId: 'j1',
    })
    expect(error).toBeNull()
  })

  it('returns an error when the worker is not on Regulix', async () => {
    // Callers should route krewtree-only workers through a different channel;
    // this Regulix-side function refuses them explicitly.
    const { error } = await inviteWorker({
      companyId: 'c1',
      workerId: 'w4', // in regulixAccountMap as false
      jobId: 'j1',
    })
    expect(error).toBe('worker has no Regulix account')
  })
})
