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

import type { RegulixStatus, RegulixEndorsement } from '@site/types'
import { regulixStatuses, regulixEndorsements } from '@site/data/mock'

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
