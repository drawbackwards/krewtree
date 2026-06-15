import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the supabase client before importing the service under test.
// Use vi.hoisted so the mocks are available when vi.mock's factory runs.
//
// Every query-builder method returns the builder, so arbitrary chains work
// (.select().eq().eq().order(), .order().eq(), .insert()...). Awaiting the
// builder resolves with the next queued result for that table, or an empty
// success when nothing is queued (e.g. the pipeline-stage lookup that
// getKanbanApplicants runs alongside the applications query).
const { fromMock, eqMock, orderMock, queueResult, resetQueuedResults } = vi.hoisted(() => {
  type QueryResult = { data: unknown; error: unknown }

  type MockBuilder = {
    select: (...args: unknown[]) => MockBuilder
    insert: (...args: unknown[]) => MockBuilder
    update: (...args: unknown[]) => MockBuilder
    delete: (...args: unknown[]) => MockBuilder
    eq: (...args: unknown[]) => MockBuilder
    neq: (...args: unknown[]) => MockBuilder
    in: (...args: unknown[]) => MockBuilder
    order: (...args: unknown[]) => MockBuilder
    limit: (...args: unknown[]) => MockBuilder
    range: (...args: unknown[]) => MockBuilder
    single: (...args: unknown[]) => MockBuilder
    maybeSingle: (...args: unknown[]) => MockBuilder
    then: (
      onFulfilled?: ((value: QueryResult) => unknown) | null,
      onRejected?: ((reason: unknown) => unknown) | null
    ) => Promise<unknown>
  }

  const queues = new Map<string, QueryResult[]>()

  const selectMock = vi.fn()
  const insertMock = vi.fn()
  const updateMock = vi.fn()
  const deleteMock = vi.fn()
  const eqMock = vi.fn()
  const neqMock = vi.fn()
  const inMock = vi.fn()
  const orderMock = vi.fn()
  const limitMock = vi.fn()
  const rangeMock = vi.fn()
  const singleMock = vi.fn()
  const maybeSingleMock = vi.fn()

  const fromMock = vi.fn((table: string): MockBuilder => {
    const chain =
      (spy: (...args: unknown[]) => unknown) =>
      (...args: unknown[]): MockBuilder => {
        spy(...args)
        return builder
      }

    const builder: MockBuilder = {
      select: chain(selectMock),
      insert: chain(insertMock),
      update: chain(updateMock),
      delete: chain(deleteMock),
      eq: chain(eqMock),
      neq: chain(neqMock),
      in: chain(inMock),
      order: chain(orderMock),
      limit: chain(limitMock),
      range: chain(rangeMock),
      single: chain(singleMock),
      maybeSingle: chain(maybeSingleMock),
      then: (onFulfilled, onRejected) => {
        const result = queues.get(table)?.shift() ?? { data: [], error: null }
        return Promise.resolve(result).then(onFulfilled, onRejected)
      },
    }
    return builder
  })

  const queueResult = (table: string, result: QueryResult): void => {
    const queue = queues.get(table) ?? []
    queue.push(result)
    queues.set(table, queue)
  }

  const resetQueuedResults = (): void => {
    queues.clear()
  }

  return { fromMock, eqMock, orderMock, queueResult, resetQueuedResults }
})

vi.mock('../../../lib/supabase', () => ({
  supabase: { from: fromMock },
}))

import { getKanbanApplicants } from '../applicantService'

beforeEach(() => {
  vi.clearAllMocks()
  resetQueuedResults()
})

describe('getKanbanApplicants', () => {
  it('queries active stages only and returns mapped applicants', async () => {
    queueResult('pipeline_stage', {
      data: [
        {
          id: 'stage-screening',
          name: 'Screening',
          sort_order: 0,
          is_active: true,
          company_pipeline: { company_id: 'company-1' },
        },
      ],
      error: null,
    })
    queueResult('applications', {
      data: [
        {
          id: 'app-1',
          current_stage_id: 'stage-screening',
          status: 'active',
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
          application_task: [],
        },
      ],
      error: null,
    })

    const result = await getKanbanApplicants('company-1')

    expect(fromMock).toHaveBeenCalledWith('applications')
    expect(eqMock).toHaveBeenCalledWith('company_id', 'company-1')
    expect(eqMock).toHaveBeenCalledWith('status', 'active')
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result.error).toBeNull()
    expect(result.data).toHaveLength(1)
    expect(result.data[0]).toMatchObject({
      id: 'app-1',
      workerFullName: 'Jane Doe',
      workerInitials: 'JD',
      jobTitle: 'Senior Electrician',
      currentStageId: 'stage-screening',
      currentStageName: 'Screening',
    })
  })

  it('returns error message when supabase returns an error', async () => {
    queueResult('applications', { data: null, error: { message: 'rls denied' } })
    const result = await getKanbanApplicants('company-1')
    expect(result.data).toEqual([])
    expect(result.error).toBe('rls denied')
  })
})
