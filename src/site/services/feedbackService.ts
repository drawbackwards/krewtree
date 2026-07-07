import { supabase, getCurrentUserId } from '@/lib/supabase'

// ── Types ────────────────────────────────────────────────────────────────────

export type PillSentiment = 'positive' | 'negative'
export type WouldHireAgain = 'yes' | 'no' | 'unsure'

export type FeedbackPill = {
  id: string
  slug: string
  label: string
  sentiment: PillSentiment
  order: number
}

/** Canonical pills split by sentiment — the shape the feedback form consumes. */
export type FeedbackPillLists = {
  positive: FeedbackPill[]
  negative: FeedbackPill[]
}

export type TopPill = {
  id: string
  slug: string
  label: string
  count: number
}

/** Top pills for the Rating card, already sliced to the top few per sentiment. */
export type TopPills = {
  positive: TopPill[]
  negative: TopPill[]
}

export type WorkerFeedbackAggregate = {
  averageRating: number | null
  reviewCount: number
}

/** One entry in the company-facing history view (visibility-scoped by the RPC). */
export type FeedbackHistoryEntry = {
  id: string
  /** Present only on the viewer's own entries — used to open the edit form. */
  applicationId: string | null
  jobId: string
  jobTitle: string | null
  starRating: number
  wouldHireAgain: WouldHireAgain
  createdAt: string
  isOwn: boolean
  isEditable: boolean
  /** Null unless the viewer authored this entry (§6.3). */
  commentary: string | null
  positivePills: string[]
  negativePills: string[]
}

/** The reviewing company's own feedback for one application (edit prefill + eligibility). */
export type FeedbackRecord = {
  id: string
  workerId: string
  applicationId: string
  jobId: string
  starRating: number
  wouldHireAgain: WouldHireAgain
  commentary: string | null
  pillIds: string[]
  createdAt: string
  lockedAt: string
  isEditable: boolean
}

export type SubmitFeedbackInput = {
  workerId: string
  applicationId: string
  starRating: number
  wouldHireAgain: WouldHireAgain
  commentary?: string | null
  pillIds: string[]
}

export type UpdateFeedbackInput = {
  starRating: number
  wouldHireAgain: WouldHireAgain
  commentary?: string | null
  pillIds: string[]
}

// How many pills the Rating card surfaces per sentiment (spec §7.2: top 3-5).
const TOP_PILL_LIMIT = 5

// ── Reads ────────────────────────────────────────────────────────────────────

/** Canonical active pills, split into positive/negative and ordered for display. */
export async function getFeedbackPills(): Promise<{
  data: FeedbackPillLists
  error: string | null
}> {
  const empty: FeedbackPillLists = { positive: [], negative: [] }
  const { data, error } = await supabase
    .from('feedback_pill')
    .select('id, slug, label, sentiment, display_order')
    .eq('active', true)
    .order('sentiment', { ascending: true })
    .order('display_order', { ascending: true })

  if (error) return { data: empty, error: error.message }
  if (!data) return { data: empty, error: null }

  const lists: FeedbackPillLists = { positive: [], negative: [] }
  for (const row of data) {
    const pill: FeedbackPill = {
      id: row.id,
      slug: row.slug,
      label: row.label,
      sentiment: row.sentiment as PillSentiment,
      order: row.display_order,
    }
    if (pill.sentiment === 'negative') lists.negative.push(pill)
    else lists.positive.push(pill)
  }
  return { data: lists, error: null }
}

/**
 * Aggregate rating + review count for a worker. Backed by a SECURITY DEFINER
 * RPC so workers (who can't read individual rows) still get their own number.
 * Shows from the first review; averageRating is null when there is no feedback.
 */
export async function getWorkerFeedbackAggregate(
  workerId: string
): Promise<{ data: WorkerFeedbackAggregate; error: string | null }> {
  const { data, error } = await supabase.rpc('get_worker_feedback_aggregate', {
    p_worker_id: workerId,
  })
  if (error) return { data: { averageRating: null, reviewCount: 0 }, error: error.message }

  const row = data?.[0]
  return {
    data: {
      averageRating: row?.average_rating ?? null,
      reviewCount: row?.review_count ?? 0,
    },
    error: null,
  }
}

/**
 * Top pills by frequency for the Rating card (company-facing). Returns nothing
 * to a worker caller — the underlying RPC relies on RLS. Sliced to the top few
 * per sentiment; the RPC already orders by count then canonical display order.
 */
export async function getWorkerFeedbackTopPills(
  workerId: string
): Promise<{ data: TopPills; error: string | null }> {
  const empty: TopPills = { positive: [], negative: [] }
  const { data, error } = await supabase.rpc('get_worker_feedback_top_pills', {
    p_worker_id: workerId,
  })
  if (error) return { data: empty, error: error.message }
  if (!data) return { data: empty, error: null }

  const result: TopPills = { positive: [], negative: [] }
  for (const row of data) {
    const bucket = row.sentiment === 'negative' ? result.negative : result.positive
    if (bucket.length >= TOP_PILL_LIMIT) continue
    bucket.push({ id: row.pill_id, slug: row.slug, label: row.label, count: row.cnt })
  }
  return { data: result, error: null }
}

/**
 * Per-entry history for the profile history view. The RPC enforces visibility:
 * workers get nothing, non-authoring companies get everything but commentary,
 * the authoring company gets commentary + edit affordance on their own entries.
 */
export async function getWorkerFeedbackHistory(
  workerId: string
): Promise<{ data: FeedbackHistoryEntry[]; error: string | null }> {
  const { data, error } = await supabase.rpc('get_worker_feedback_history', {
    p_worker_id: workerId,
  })
  if (error) return { data: [], error: error.message }
  if (!data) return { data: [], error: null }

  return {
    data: data.map((row) => ({
      id: row.id,
      applicationId: row.application_id,
      jobId: row.job_id,
      jobTitle: row.job_title,
      starRating: row.star_rating,
      wouldHireAgain: row.would_hire_again as WouldHireAgain,
      createdAt: row.created_at,
      isOwn: row.is_own,
      isEditable: row.is_editable,
      commentary: row.commentary,
      positivePills: row.positive_pills ?? [],
      negativePills: row.negative_pills ?? [],
    })),
    error: null,
  }
}

/**
 * The reviewing company's own feedback for a given application, or null if none
 * exists yet. Drives trigger-point eligibility (none → Leave, editable → Edit,
 * locked → View) and prefills the edit form.
 */
export async function getFeedbackForApplication(
  applicationId: string
): Promise<{ data: FeedbackRecord | null; error: string | null }> {
  const companyId = await getCurrentUserId()
  if (!companyId) return { data: null, error: 'Not authenticated.' }

  const { data, error } = await supabase
    .from('worker_feedback')
    .select(
      'id, worker_id, application_id, job_id, star_rating, would_hire_again, commentary, created_at, locked_at'
    )
    .eq('application_id', applicationId)
    .eq('reviewing_company_id', companyId)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: null }

  const { data: pillRows, error: pillError } = await supabase
    .from('worker_feedback_pill')
    .select('pill_id')
    .eq('feedback_id', data.id)
  if (pillError) return { data: null, error: pillError.message }

  return {
    data: {
      id: data.id,
      workerId: data.worker_id,
      applicationId: data.application_id,
      jobId: data.job_id,
      starRating: data.star_rating,
      wouldHireAgain: data.would_hire_again as WouldHireAgain,
      commentary: data.commentary,
      pillIds: (pillRows ?? []).map((p) => p.pill_id),
      createdAt: data.created_at,
      lockedAt: data.locked_at,
      isEditable: new Date(data.locked_at).getTime() > Date.now(),
    },
    error: null,
  }
}

/** Feedback presence + editability + rating for a set of applications (own company). */
export type FeedbackStatus = {
  feedbackId: string
  isEditable: boolean
  starRating: number
}

/**
 * Maps each application (of the given set) that this company has left feedback
 * on to its status. Applications with no feedback are simply absent from the
 * map. Drives the job-card overflow labels: absent → Leave, editable → Edit,
 * locked → View. One query for the whole history list.
 */
export async function getFeedbackStatusForApplications(
  applicationIds: string[]
): Promise<{ data: Record<string, FeedbackStatus>; error: string | null }> {
  if (applicationIds.length === 0) return { data: {}, error: null }

  const companyId = await getCurrentUserId()
  if (!companyId) return { data: {}, error: 'Not authenticated.' }

  const { data, error } = await supabase
    .from('worker_feedback')
    .select('id, application_id, locked_at, star_rating')
    .in('application_id', applicationIds)
    .eq('reviewing_company_id', companyId)

  if (error) return { data: {}, error: error.message }

  const map: Record<string, FeedbackStatus> = {}
  for (const row of data ?? []) {
    map[row.application_id] = {
      feedbackId: row.id,
      isEditable: new Date(row.locked_at).getTime() > Date.now(),
      starRating: Number(row.star_rating),
    }
  }
  return { data: map, error: null }
}

// ── Writes ───────────────────────────────────────────────────────────────────

/**
 * Create feedback for a hired application. job_id and locked_at are set by a DB
 * trigger; eligibility (own terminal_hired application, one per application) is
 * enforced by RLS + the unique constraint, so the returned error is
 * authoritative. Aggregates recompute lazily on the next read (spec §7.4).
 */
export async function submitFeedback(
  input: SubmitFeedbackInput
): Promise<{ data: { id: string } | null; error: string | null }> {
  const companyId = await getCurrentUserId()
  if (!companyId) return { data: null, error: 'Not authenticated.' }

  const { data, error } = await supabase
    .from('worker_feedback')
    .insert({
      worker_id: input.workerId,
      reviewing_company_id: companyId,
      application_id: input.applicationId,
      star_rating: input.starRating,
      would_hire_again: input.wouldHireAgain,
      commentary: input.commentary ?? null,
    })
    .select('id')
    .single()

  if (error) return { data: null, error: error.message }

  const pillError = await replacePills(data.id, input.pillIds)
  if (pillError) return { data: null, error: pillError }

  return { data: { id: data.id }, error: null }
}

/**
 * Edit feedback within the 24-hour window. The window is a server-side boundary
 * (spec §12.3): the RLS UPDATE policy rejects writes past locked_at, so an empty
 * update result means the entry is locked — surfaced as a clear error.
 */
export async function updateFeedback(
  feedbackId: string,
  input: UpdateFeedbackInput
): Promise<{ data: { id: string } | null; error: string | null }> {
  const { data, error } = await supabase
    .from('worker_feedback')
    .update({
      star_rating: input.starRating,
      would_hire_again: input.wouldHireAgain,
      commentary: input.commentary ?? null,
    })
    .eq('id', feedbackId)
    .select('id')

  if (error) return { data: null, error: error.message }
  if (!data || data.length === 0) {
    return { data: null, error: 'This feedback can no longer be edited (24-hour window closed).' }
  }

  const pillError = await replacePills(feedbackId, input.pillIds)
  if (pillError) return { data: null, error: pillError }

  return { data: { id: feedbackId }, error: null }
}

/**
 * Reconcile a feedback row's pills to exactly `pillIds` (clear then re-insert).
 * Returns an error message on failure, or null on success. The pill RLS
 * policies also enforce the 24-hour window, so this is safe post-lock.
 */
async function replacePills(feedbackId: string, pillIds: string[]): Promise<string | null> {
  const { error: deleteError } = await supabase
    .from('worker_feedback_pill')
    .delete()
    .eq('feedback_id', feedbackId)
  if (deleteError) return deleteError.message

  if (pillIds.length === 0) return null

  const { error: insertError } = await supabase
    .from('worker_feedback_pill')
    .insert(pillIds.map((pillId) => ({ feedback_id: feedbackId, pill_id: pillId })))
  return insertError ? insertError.message : null
}
