import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the supabase client before importing the service under test.
const orderMock = vi.fn()
const inMock = vi.fn(() => ({ order: orderMock }))
const eqMock = vi.fn(() => ({ in: inMock }))
const selectMock = vi.fn(() => ({ eq: eqMock }))
const fromMock = vi.fn(() => ({ select: selectMock }))

vi.mock('../../../lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}))

import { getKanbanApplicants } from '../applicantService'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getKanbanApplicants', () => {
  it('queries active stages only and returns mapped applicants', async () => {
    orderMock.mockResolvedValueOnce({
      data: [
        {
          id: 'app-1',
          kanban_stage: 'new',
          match_score: 80,
          is_shortlisted: false,
          interview_answers: [],
          created_at: '2026-04-20T00:00:00Z',
          worker_profiles: {
            id: 'w-1',
            first_name: 'Jane',
            last_name: 'Doe',
            avatar_url: null,
            primary_trade: 'Electrician',
            city: 'Austin',
            region: 'TX',
            is_regulix_ready: false,
          },
          jobs: { id: 'j-1', title: 'Senior Electrician', status: 'active' },
          application_notes: [],
        },
      ],
      error: null,
    })

    const result = await getKanbanApplicants('company-1')

    expect(fromMock).toHaveBeenCalledWith('applications')
    expect(eqMock).toHaveBeenCalledWith('jobs.company_id', 'company-1')
    expect(inMock).toHaveBeenCalledWith('kanban_stage', ['new', 'reviewed', 'interview', 'offer'])
    expect(result.error).toBeNull()
    expect(result.data).toHaveLength(1)
    expect(result.data[0]).toMatchObject({
      id: 'app-1',
      workerFullName: 'Jane Doe',
      workerInitials: 'JD',
      jobTitle: 'Senior Electrician',
      stage: 'new',
    })
  })

  it('returns error message when supabase returns an error', async () => {
    orderMock.mockResolvedValueOnce({ data: null, error: { message: 'rls denied' } })
    const result = await getKanbanApplicants('company-1')
    expect(result.data).toEqual([])
    expect(result.error).toBe('rls denied')
  })
})
