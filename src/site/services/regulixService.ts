// ============================================================
// KREWTREE — Regulix Service (v1: mock-backed stubs)
//
// All Regulix reads/writes from the company dashboard go through this file.
// The real Regulix HTTP API does not exist yet — v1 resolves against in-repo
// fixtures so downstream features (rank score, talent pool, applicant
// redesign) can ship. Swap the function bodies for HTTP calls when the API
// lands; the callers do not change.
//
// Never import PII, timesheets, hours, or payroll data here — those are
// outside krewtree's scope (see spec §1.2).
// ============================================================

import type {
  RegulixStatus,
  RegulixEndorsement,
  VerifiedWorkHistoryEntry,
  PastHire,
  HireHandoffParams,
  HireHandoffResult,
  RegulixInviteParams,
} from '@site/types'
import {
  regulixStatuses,
  regulixAccountMap,
  regulixEndorsements,
  regulixWorkHistory,
  regulixPastHires,
} from '@site/data/mock'

// ── Reads ──────────────────────────────────────────────────────────────────

export async function getRegulixStatus(
  workerId: string
): Promise<{ data: RegulixStatus | null; error: string | null }> {
  const status = regulixStatuses[workerId] ?? null
  return { data: status, error: null }
}

export async function getEndorsements(
  workerId: string
): Promise<{ data: RegulixEndorsement[]; error: string | null }> {
  const data = regulixEndorsements.filter((e) => e.workerId === workerId)
  return { data, error: null }
}

export async function getVerifiedWorkHistory(
  workerId: string
): Promise<{ data: VerifiedWorkHistoryEntry[]; error: string | null }> {
  const entries = regulixWorkHistory
    .filter((e) => e.workerId === workerId)
    .slice()
    .sort((a, b) => {
      // null endDate (current job) sorts first; otherwise newest endDate first
      if (a.endDate === null && b.endDate !== null) return -1
      if (b.endDate === null && a.endDate !== null) return 1
      if (a.endDate === null && b.endDate === null) return 0
      return (b.endDate as string).localeCompare(a.endDate as string)
    })
  return { data: entries, error: null }
}

export async function getPastHires(
  companyId: string
): Promise<{ data: PastHire[]; error: string | null }> {
  const data = regulixPastHires.filter((p) => p.companyId === companyId)
  return { data, error: null }
}

export async function hasRegulixAccount(
  workerId: string
): Promise<{ data: boolean; error: string | null }> {
  return { data: regulixAccountMap[workerId] === true, error: null }
}

// ── Writes ─────────────────────────────────────────────────────────────────

export async function submitHireHandoff(
  params: HireHandoffParams
): Promise<{ data: HireHandoffResult | null; error: string | null }> {
  // v1 just returns a synthetic id. v2 will POST to Regulix and return the
  // real hire id from the response.
  const regulixHireId = `mock-hire-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  void params // keep param reference so linters don't flag it; real impl will use it
  return { data: { regulixHireId }, error: null }
}

export async function linkCompanyAccount(
  companyId: string,
  regulixCompanyId: string
): Promise<{ error: string | null }> {
  if (!companyId) return { error: 'companyId is required' }
  if (!regulixCompanyId) return { error: 'regulixCompanyId is required' }
  // v1 no-op. v2 will persist the link in Supabase and notify Regulix.
  return { error: null }
}

export async function inviteWorker(params: RegulixInviteParams): Promise<{ error: string | null }> {
  // This is the Regulix-side channel of the dual-channel invite flow
  // described in spec §3.5. The caller must check hasRegulixAccount first
  // and fall back to the krewtree email channel for non-Regulix workers.
  // Regulix-side function refuses non-Regulix workers explicitly.
  if (regulixAccountMap[params.workerId] !== true) {
    return { error: 'worker has no Regulix account' }
  }
  return { error: null }
}
