// ============================================================
// KREWTREE — Message Service
// Unified messaging: one thread per (company, worker) pair, backed
// by the `message` table. Application context travels per-message —
// pipeline sends (and messages composed from an application deep
// link) carry application_id / calendar_link; plain chat messages
// carry none. Messages have no subjects: pipeline template subjects
// are internal labels (task list, log entries) and never ship.
//
// RLS scopes every query to threads the caller is a party to, so no
// persona filter is needed anywhere: sent_by is always one of the
// two parties (NOT NULL + CHECK), which makes "from the other party"
// simply sent_by <> me for both sides.
// ============================================================

import { supabase, getCurrentUserId } from '../../lib/supabase'
import type { Database } from '../../lib/database.types'

type MessageRow = Database['public']['Tables']['message']['Row']

/** PostgREST embed shape: each message joins its application's job title. */
type MessageRowWithContext = MessageRow & {
  applications: { job_id: string; jobs: { title: string } | null } | null
}

const MESSAGE_CONTEXT_SELECT = '*, applications(job_id, jobs(title))'

/**
 * Window event dispatched after a thread is marked read so the nav
 * badge can refresh without polling.
 */
export const MESSAGES_READ_EVENT = 'kt-messages-read'

export type SenderRole = 'worker' | 'company'

export type ThreadMessage = {
  id: string
  body: string
  calendarLink: string | null
  sentAt: string
  sentBy: string
  readAt: string | null
  senderRole: SenderRole
  /** Application context, when this message was sent about a specific application. */
  applicationId: string | null
  jobId: string | null
  jobTitle: string | null
}

export type Conversation = {
  /** Stable list/selection key — `<companyId>:<workerId>`. */
  key: string
  companyId: string
  companyName: string
  companyLogo: string | null
  workerId: string
  workerName: string
  workerAvatar: string | null
  lastMessage: ThreadMessage | null
  unreadCount: number
  messageCount: number
}

/** Coordinates for opening the pair thread behind an application deep link. */
export type ApplicationThreadRef = {
  applicationId: string
  companyId: string
  workerId: string
  jobId: string
  jobTitle: string
}

export function conversationKey(companyId: string, workerId: string): string {
  return `${companyId}:${workerId}`
}

function toThreadMessage(row: MessageRowWithContext): ThreadMessage {
  return {
    id: row.id,
    body: row.body,
    calendarLink: row.calendar_link,
    sentAt: row.sent_at,
    sentBy: row.sent_by,
    readAt: row.read_at,
    senderRole: row.sent_by === row.worker_id ? 'worker' : 'company',
    applicationId: row.application_id,
    jobId: row.applications?.job_id ?? null,
    jobTitle: row.applications?.jobs?.title ?? null,
  }
}

// ── Conversation list ────────────────────────────────────────────────────────

/**
 * All conversations for the current user, newest activity first — one
 * row per (company, worker) pair, aggregated in Postgres. unreadCount
 * counts messages sent by the other party that the viewer hasn't read.
 */
export async function getConversations(): Promise<{
  data: Conversation[]
  error: string | null
}> {
  const { data, error } = await supabase.rpc('get_conversation_summaries')

  if (error) return { data: [], error: error.message }

  const conversations: Conversation[] = (data ?? []).map((row) => ({
    key: conversationKey(row.company_id, row.worker_id),
    companyId: row.company_id,
    companyName: row.company_name,
    companyLogo: row.company_logo,
    workerId: row.worker_id,
    workerName: `${row.worker_first_name} ${row.worker_last_name}`.trim(),
    workerAvatar: row.worker_avatar,
    lastMessage: {
      id: row.last_message_id,
      body: row.last_body,
      calendarLink: row.last_calendar_link,
      sentAt: row.last_sent_at,
      sentBy: row.last_sent_by,
      readAt: row.last_read_at,
      senderRole: row.last_sent_by === row.worker_id ? 'worker' : 'company',
      applicationId: row.last_application_id,
      jobId: row.last_job_id,
      jobTitle: row.last_job_title,
    },
    unreadCount: row.unread_count,
    messageCount: row.message_count,
  }))

  return { data: conversations, error: null }
}

/**
 * Conversation header data for a pair thread with no messages yet —
 * used when deep-linking into a thread that doesn't exist (e.g. a
 * company opening the chat pane for a worker they've never messaged).
 */
export async function getConversationStub(
  companyId: string,
  workerId: string
): Promise<{ data: Conversation | null; error: string | null }> {
  const [companyRes, workerRes] = await Promise.all([
    supabase.from('company_profiles').select('id, name, logo_url').eq('id', companyId).single(),
    supabase
      .from('worker_profiles')
      .select('id, first_name, last_name, avatar_url')
      .eq('id', workerId)
      .single(),
  ])

  if (companyRes.error || !companyRes.data)
    return { data: null, error: companyRes.error?.message ?? 'not_found' }
  if (workerRes.error || !workerRes.data)
    return { data: null, error: workerRes.error?.message ?? 'not_found' }

  const worker = workerRes.data
  const company = companyRes.data
  return {
    data: {
      key: conversationKey(company.id, worker.id),
      companyId: company.id,
      companyName: company.name,
      companyLogo: company.logo_url,
      workerId: worker.id,
      workerName: `${worker.first_name} ${worker.last_name}`.trim(),
      workerAvatar: worker.avatar_url,
      lastMessage: null,
      unreadCount: 0,
      messageCount: 0,
    },
    error: null,
  }
}

/**
 * Resolve an application id to its pair-thread coordinates plus job
 * context — backs `?application=<id>` deep links, which open the pair
 * thread and tag composed messages with the application.
 */
export async function getApplicationThreadRef(
  applicationId: string
): Promise<{ data: ApplicationThreadRef | null; error: string | null }> {
  const { data, error } = await supabase
    .from('applications')
    .select('id, company_id, worker_id, jobs!inner(id, title)')
    .eq('id', applicationId)
    .single()

  if (error || !data) return { data: null, error: error?.message ?? 'not_found' }
  const row = data as unknown as {
    id: string
    company_id: string
    worker_id: string
    jobs: { id: string; title: string }
  }
  return {
    data: {
      applicationId: row.id,
      companyId: row.company_id,
      workerId: row.worker_id,
      jobId: row.jobs.id,
      jobTitle: row.jobs.title,
    },
    error: null,
  }
}

// ── Thread fetch ─────────────────────────────────────────────────────────────

/** Full message history for one pair thread, oldest first. */
export async function getThreadMessages(
  companyId: string,
  workerId: string
): Promise<{ data: ThreadMessage[]; error: string | null }> {
  const { data, error } = await supabase
    .from('message')
    .select(MESSAGE_CONTEXT_SELECT)
    .eq('company_id', companyId)
    .eq('worker_id', workerId)
    .order('sent_at', { ascending: true })

  if (error) return { data: [], error: error.message }
  return {
    data: (data ?? []).map((row) => toThreadMessage(row as unknown as MessageRowWithContext)),
    error: null,
  }
}

// ── Send ─────────────────────────────────────────────────────────────────────

/**
 * Send a message on a pair thread. Works for both personas — RLS
 * rejects the insert if the caller isn't one of the two parties or
 * tries to spoof sent_by. Pass `applicationId` to tag the message with
 * application context (RLS verifies the application belongs to the pair).
 */
export async function sendMessage(
  companyId: string,
  workerId: string,
  body: string,
  opts: { applicationId?: string | null } = {}
): Promise<{ data: ThreadMessage | null; error: string | null }> {
  const trimmedBody = body.trim().slice(0, 10000)
  if (!trimmedBody) return { data: null, error: 'empty_message' }

  const userId = await getCurrentUserId()
  if (!userId) return { data: null, error: 'not_authenticated' }

  const { data, error } = await supabase
    .from('message')
    .insert({
      company_id: companyId,
      worker_id: workerId,
      body: trimmedBody,
      sent_by: userId,
      application_id: opts.applicationId ?? null,
    })
    .select(MESSAGE_CONTEXT_SELECT)
    .single()

  if (error || !data) return { data: null, error: error?.message ?? 'insert_failed' }
  return { data: toThreadMessage(data as unknown as MessageRowWithContext), error: null }
}

// ── Read tracking ────────────────────────────────────────────────────────────

/**
 * Mark every unread message from the other party in a pair thread as
 * read. sent_by is always set, so "from the other party" is sent_by ≠ me.
 */
export async function markThreadRead(
  companyId: string,
  workerId: string
): Promise<{ error: string | null }> {
  const userId = await getCurrentUserId()
  if (!userId) return { error: 'not_authenticated' }

  const { error } = await supabase
    .from('message')
    .update({ read_at: new Date().toISOString() })
    .eq('company_id', companyId)
    .eq('worker_id', workerId)
    .is('read_at', null)
    .neq('sent_by', userId)

  return { error: error?.message ?? null }
}

/**
 * Total unread messages from the other party across all threads —
 * drives the nav badge. Single integer computed in Postgres.
 */
export async function getUnreadMessageCount(): Promise<{
  data: number
  error: string | null
}> {
  const { data, error } = await supabase.rpc('get_unread_message_count')

  if (error) return { data: 0, error: error.message }
  return { data: data ?? 0, error: null }
}
