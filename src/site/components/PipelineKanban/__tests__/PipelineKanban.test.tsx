import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import type { CompanyApplicant } from '../../../types'

const { getKanbanApplicantsMock, setApplicantStageMock } = vi.hoisted(() => ({
  getKanbanApplicantsMock: vi.fn(),
  setApplicantStageMock: vi.fn(),
}))

vi.mock('../../../services/applicantService', () => ({
  getKanbanApplicants: getKanbanApplicantsMock,
  setApplicantStage: setApplicantStageMock,
}))

import { PipelineKanban } from '../PipelineKanban'

function makeApplicant(id: string, stage: CompanyApplicant['stage']): CompanyApplicant {
  return {
    id,
    workerId: `w-${id}`,
    workerFirstName: 'Jane',
    workerLastInitial: 'D',
    workerFullName: `Jane ${id}`,
    workerAvatar: '',
    workerInitials: 'JD',
    workerPrimaryTrade: 'Electrician',
    workerLocation: 'Austin, TX',
    workerAvailability: 'available',
    workerTopSkills: [],
    workerCertifications: [],
    workerJobHistory: [],
    workerRating: null,
    workerRatingCount: 0,
    workerRegulixRating: null,
    workerRegulixRatingCount: 0,
    jobId: 'j-1',
    jobTitle: 'Senior Electrician',
    jobStatus: 'active',
    stage,
    matchScore: 80,
    matchBreakdown: { skills: 80, location: 80, availability: 0 },
    isRegulixReady: false,
    isShortlisted: false,
    appliedAt: '2026-04-20T00:00:00Z',
    notes: [],
    preInterviewAnswers: [],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PipelineKanban', () => {
  it('loads applicants and renders them in the right columns', async () => {
    getKanbanApplicantsMock.mockResolvedValue({
      data: [makeApplicant('a1', 'new'), makeApplicant('a2', 'interview')],
      error: null,
    })

    render(<PipelineKanban companyId="c-1" />)

    await waitFor(() => {
      expect(screen.getByText('Jane a1')).toBeInTheDocument()
      expect(screen.getByText('Jane a2')).toBeInTheDocument()
    })
  })

  it('optimistically moves a card on drag end and reverts on service error', async () => {
    getKanbanApplicantsMock.mockResolvedValue({
      data: [makeApplicant('a1', 'new')],
      error: null,
    })
    setApplicantStageMock.mockResolvedValue({ error: 'db_error' })

    const { container } = render(<PipelineKanban companyId="c-1" />)
    await waitFor(() => expect(screen.getByText('Jane a1')).toBeInTheDocument())

    const ref = (
      window as unknown as {
        __kanbanTest?: { triggerDragEnd(id: string, to: string): Promise<void> }
      }
    ).__kanbanTest
    expect(ref).toBeDefined()

    await act(async () => {
      await ref!.triggerDragEnd('a1', 'interview')
    })

    expect(setApplicantStageMock).toHaveBeenCalledWith('a1', 'interview')

    // After revert, card should still be in 'new' column
    const newCol = container.querySelector('[data-stage="new"]')
    expect(newCol?.textContent).toContain('Jane a1')
  })
})
