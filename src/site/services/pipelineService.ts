// ============================================================
// KREWTREE — Pipeline Service
// Task system, stage notes, and event log for the applicant drawer.
//
// All functions return { data, error } following the service layer
// convention. Writes to application_log are best-effort — the
// migration grants read+write to the company role; if a write is
// denied the mutation still returns success.
// ============================================================

import type {
  ApplicationTask,
  ApplicationLogEvent,
  ApplicationMessage,
  StageNote,
  TaskState,
  LogEventType,
} from '../types'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../lib/database.types'
import shortTemplate from '../../../seeds/pipeline-templates/short.json'
import longTemplate from '../../../seeds/pipeline-templates/long.json'

type TaskRow = Database['public']['Tables']['application_task']['Row']
type NoteRow = Database['public']['Tables']['application_stage_notes']['Row']
type LogRow = Database['public']['Tables']['application_log']['Row']
type TemplateRow = Database['public']['Tables']['pipeline_stage_task_template']['Row']
type MessageRow = Database['public']['Tables']['application_message']['Row']

export type TaskTemplate = {
  id: string
  companyId: string
  stageId: string
  label: string
  isRequired: boolean
  order: number
  messageSubject: string | null
  messageBody: string | null
  calendarLink: string | null
  autoSend: boolean
}

function toTemplate(row: TemplateRow): TaskTemplate {
  return {
    id: row.id,
    companyId: row.company_id,
    stageId: row.stage_id,
    label: row.label,
    isRequired: row.is_required,
    order: row.display_order,
    messageSubject: row.message_subject,
    messageBody: row.message_body,
    calendarLink: row.calendar_link,
    autoSend: row.auto_send,
  }
}

function toMessage(row: MessageRow): ApplicationMessage {
  return {
    id: row.id,
    applicationId: row.application_id,
    applicationTaskId: row.application_task_id,
    subject: row.subject,
    body: row.body,
    calendarLink: row.calendar_link,
    sentAt: row.sent_at,
    sentBy: row.sent_by,
    readAt: row.read_at,
  }
}

// ── Row → app type mappers ───────────────────────────────────────────────────

function toTask(row: TaskRow): ApplicationTask {
  return {
    id: row.id,
    applicationId: row.application_id,
    stageId: row.stage_id,
    source: row.source,
    templateTaskId: row.template_task_id,
    label: row.label,
    isRequired: row.is_required,
    state: row.completed_at ? 'completed' : row.skipped_at ? 'skipped' : 'incomplete',
    completedAt: row.completed_at,
    completedBy: row.completed_by,
    skippedAt: row.skipped_at,
    skippedBy: row.skipped_by,
    notes: row.notes,
    dueDate: row.due_date,
    order: row.display_order,
    createdAt: row.created_at,
    messageSubject: row.message_subject,
    messageBody: row.message_body,
    calendarLink: row.calendar_link,
    autoSend: row.auto_send,
    messageSentAt: row.message_sent_at,
  }
}

function toNote(row: NoteRow): StageNote {
  return {
    applicationId: row.application_id,
    stageId: row.stage_id,
    notes: row.notes,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by ?? '',
  }
}

function toLogEvent(row: LogRow): ApplicationLogEvent {
  return {
    id: row.id,
    applicationId: row.application_id,
    eventType: row.event_type as LogEventType,
    actor: row.actor,
    description: row.description,
    createdAt: row.created_at,
  }
}

// ── Best-effort log append ───────────────────────────────────────────────────

async function appendLog(
  applicationId: string,
  event: { eventType: LogEventType; actor: string; description: string }
): Promise<void> {
  await supabase.from('application_log').insert({
    application_id: applicationId,
    event_type: event.eventType,
    actor: event.actor,
    description: event.description,
  })
}

// ── Task queries ─────────────────────────────────────────────────────────────

export async function getApplicationTasks(
  applicationId: string,
  stageId: string
): Promise<{ data: ApplicationTask[]; error: string | null }> {
  const { data, error } = await supabase
    .from('application_task')
    .select('*')
    .eq('application_id', applicationId)
    .eq('stage_id', stageId)
    .order('display_order', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []).map(toTask), error: null }
}

// ── Task mutations ───────────────────────────────────────────────────────────

export async function toggleTaskComplete(
  applicationId: string,
  taskId: string,
  completed: boolean
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const patch = completed
    ? {
        completed_at: new Date().toISOString(),
        completed_by: user?.id ?? null,
        skipped_at: null,
        skipped_by: null,
      }
    : { completed_at: null, completed_by: null }

  const { error } = await supabase
    .from('application_task')
    .update(patch)
    .eq('id', taskId)
    .eq('application_id', applicationId)

  if (error) return { error: error.message }

  await appendLog(applicationId, {
    eventType: completed ? 'task_completed' : 'task_uncompleted',
    actor: 'You',
    description: completed ? `Task completed` : `Task marked incomplete`,
  })

  return { error: null }
}

export async function toggleTaskSkip(
  applicationId: string,
  taskId: string,
  skipped: boolean
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const patch = skipped
    ? {
        skipped_at: new Date().toISOString(),
        skipped_by: user?.id ?? null,
        completed_at: null,
        completed_by: null,
      }
    : { skipped_at: null, skipped_by: null }

  const { error } = await supabase
    .from('application_task')
    .update(patch)
    .eq('id', taskId)
    .eq('application_id', applicationId)

  if (error) return { error: error.message }

  await appendLog(applicationId, {
    eventType: skipped ? 'task_skipped' : 'task_unskipped',
    actor: 'You',
    description: skipped ? `Task skipped` : `Task unskipped`,
  })

  return { error: null }
}

export async function saveTaskNotes(
  applicationId: string,
  taskId: string,
  notes: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('application_task')
    .update({ notes: notes.trim() || null })
    .eq('id', taskId)
    .eq('application_id', applicationId)

  if (error) return { error: error.message }
  return { error: null }
}

export async function addAdHocTask(
  applicationId: string,
  stageId: string,
  label: string,
  isRequired: boolean,
  dueDate: string | null
): Promise<{ data: ApplicationTask | null; error: string | null }> {
  const { count } = await supabase
    .from('application_task')
    .select('id', { count: 'exact', head: true })
    .eq('application_id', applicationId)
    .eq('stage_id', stageId)

  const { data, error } = await supabase
    .from('application_task')
    .insert({
      application_id: applicationId,
      stage_id: stageId,
      source: 'ad_hoc',
      label,
      is_required: isRequired,
      due_date: dueDate,
      display_order: count ?? 0,
    })
    .select('*')
    .single()

  if (error) return { data: null, error: error.message }

  await appendLog(applicationId, {
    eventType: 'task_created',
    actor: 'You',
    description: `Added task: ${label}`,
  })

  return { data: toTask(data), error: null }
}

export async function deleteAdHocTask(
  applicationId: string,
  taskId: string
): Promise<{ error: string | null }> {
  const { data: existing, error: fetchErr } = await supabase
    .from('application_task')
    .select('label, source')
    .eq('id', taskId)
    .eq('application_id', applicationId)
    .single()

  if (fetchErr || !existing) return { error: fetchErr?.message ?? 'not_found' }
  if (existing.source !== 'ad_hoc') return { error: 'cannot_delete_template_task' }

  const { error } = await supabase
    .from('application_task')
    .delete()
    .eq('id', taskId)
    .eq('application_id', applicationId)

  if (error) return { error: error.message }

  await appendLog(applicationId, {
    eventType: 'task_deleted',
    actor: 'You',
    description: `Deleted task: ${existing.label}`,
  })

  return { error: null }
}

export async function editAdHocTask(
  applicationId: string,
  taskId: string,
  patch: { label?: string; isRequired?: boolean; dueDate?: string | null }
): Promise<{ error: string | null }> {
  const dbPatch: Record<string, unknown> = {}
  if (patch.label !== undefined) dbPatch.label = patch.label
  if (patch.isRequired !== undefined) dbPatch.is_required = patch.isRequired
  if (patch.dueDate !== undefined) dbPatch.due_date = patch.dueDate

  const { error } = await supabase
    .from('application_task')
    .update(dbPatch)
    .eq('id', taskId)
    .eq('application_id', applicationId)
    .eq('source', 'ad_hoc')

  if (error) return { error: error.message }
  return { error: null }
}

export async function editTemplateDueDate(
  applicationId: string,
  taskId: string,
  dueDate: string | null
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('application_task')
    .update({ due_date: dueDate })
    .eq('id', taskId)
    .eq('application_id', applicationId)

  if (error) return { error: error.message }
  return { error: null }
}

// ── Stage notes ──────────────────────────────────────────────────────────────

export async function getStageNotes(
  applicationId: string,
  stageId: string
): Promise<{ data: StageNote | null; error: string | null }> {
  const { data, error } = await supabase
    .from('application_stage_notes')
    .select('*')
    .eq('application_id', applicationId)
    .eq('stage_id', stageId)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: data ? toNote(data) : null, error: null }
}

export async function saveStageNotes(
  applicationId: string,
  stageId: string,
  notes: string
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('application_stage_notes').upsert(
    {
      application_id: applicationId,
      stage_id: stageId,
      notes: notes.trim() || null,
      updated_by: user?.id ?? null,
    },
    { onConflict: 'application_id,stage_id' }
  )

  if (error) return { error: error.message }

  await appendLog(applicationId, {
    eventType: 'stage_notes_updated',
    actor: 'You',
    description: 'Stage notes updated',
  })

  return { error: null }
}

// ── Event log ────────────────────────────────────────────────────────────────

export async function getApplicationLog(
  applicationId: string
): Promise<{ data: ApplicationLogEvent[]; error: string | null }> {
  const { data, error } = await supabase
    .from('application_log')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []).map(toLogEvent), error: null }
}

// ── Task state helper ────────────────────────────────────────────────────────

export function getTaskState(task: ApplicationTask): TaskState {
  return task.state
}

// ── Template instantiation ───────────────────────────────────────────────────

/**
 * Copies the company's task templates for `stage` into application_task rows
 * for this applicant. No-op if the applicant already has any template-sourced
 * tasks for that stage (so re-entering a stage doesn't duplicate work).
 *
 * Only active stages have templates — terminal stages skip silently.
 */
export async function instantiateTemplatesForStage(
  applicationId: string,
  stageId: string
): Promise<{ inserted: number; error: string | null }> {
  // Resolve the company_id for this application
  const { data: appRow, error: appErr } = await supabase
    .from('applications')
    .select('jobs!inner(company_id)')
    .eq('id', applicationId)
    .single()
  if (appErr || !appRow) return { inserted: 0, error: appErr?.message ?? 'not_found' }

  const companyId = (appRow as unknown as { jobs: { company_id: string } }).jobs.company_id

  // Skip if already instantiated for this stage
  const { count } = await supabase
    .from('application_task')
    .select('id', { count: 'exact', head: true })
    .eq('application_id', applicationId)
    .eq('stage_id', stageId)
    .eq('source', 'template')
  if ((count ?? 0) > 0) return { inserted: 0, error: null }

  // Load templates for the company+stage
  const { data: templates, error: tplErr } = await supabase
    .from('pipeline_stage_task_template')
    .select('*')
    .eq('company_id', companyId)
    .eq('stage_id', stageId)
    .order('display_order', { ascending: true })
  if (tplErr) return { inserted: 0, error: tplErr.message }
  if (!templates || templates.length === 0) return { inserted: 0, error: null }

  const rows = templates.map((t) => ({
    application_id: applicationId,
    stage_id: t.stage_id,
    source: 'template' as const,
    template_task_id: t.id,
    label: t.label,
    is_required: t.is_required,
    display_order: t.display_order,
    message_subject: t.message_subject,
    message_body: t.message_body,
    calendar_link: t.calendar_link,
    auto_send: t.auto_send,
  }))

  const { data: insertedTasks, error: insErr } = await supabase
    .from('application_task')
    .insert(rows)
    .select('*')
  if (insErr) return { inserted: 0, error: insErr.message }

  await appendLog(applicationId, {
    eventType: 'task_created',
    actor: 'System',
    description: `Tasks instantiated from template (${rows.length})`,
  })

  // Auto-send messages on tasks configured to do so.
  for (const task of insertedTasks ?? []) {
    if (task.auto_send && task.message_subject && task.message_body) {
      await sendApplicationMessage(task.id, { silent: true })
    }
  }

  return { inserted: rows.length, error: null }
}

// ── Stage task templates (organization settings) ─────────────────────────────

export async function getTaskTemplates(
  companyId: string
): Promise<{ data: TaskTemplate[]; error: string | null }> {
  const { data, error } = await supabase
    .from('pipeline_stage_task_template')
    .select('*')
    .eq('company_id', companyId)
    .order('stage_id', { ascending: true })
    .order('display_order', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []).map(toTemplate), error: null }
}

export async function createTaskTemplate(
  companyId: string,
  stageId: string,
  label: string,
  isRequired: boolean
): Promise<{ data: TaskTemplate | null; error: string | null }> {
  const trimmed = label.trim()
  if (!trimmed) return { data: null, error: 'empty_label' }

  const { count } = await supabase
    .from('pipeline_stage_task_template')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('stage_id', stageId)

  const { data, error } = await supabase
    .from('pipeline_stage_task_template')
    .insert({
      company_id: companyId,
      stage_id: stageId,
      label: trimmed,
      is_required: isRequired,
      display_order: count ?? 0,
    })
    .select('*')
    .single()

  if (error) return { data: null, error: error.message }
  return { data: toTemplate(data), error: null }
}

export type TaskTemplatePatch = {
  label?: string
  isRequired?: boolean
  messageSubject?: string | null
  messageBody?: string | null
  calendarLink?: string | null
  autoSend?: boolean
}

export async function updateTaskTemplate(
  templateId: string,
  patch: TaskTemplatePatch
): Promise<{ error: string | null }> {
  const dbPatch: Record<string, unknown> = {}
  if (patch.label !== undefined) {
    const trimmed = patch.label.trim()
    if (!trimmed) return { error: 'empty_label' }
    dbPatch.label = trimmed
  }
  if (patch.isRequired !== undefined) dbPatch.is_required = patch.isRequired
  if (patch.messageSubject !== undefined) {
    const v = patch.messageSubject?.trim() ?? ''
    dbPatch.message_subject = v.length > 0 ? v : null
  }
  if (patch.messageBody !== undefined) {
    const v = patch.messageBody?.trim() ?? ''
    dbPatch.message_body = v.length > 0 ? v : null
  }
  if (patch.calendarLink !== undefined) {
    const v = patch.calendarLink?.trim() ?? ''
    dbPatch.calendar_link = v.length > 0 ? v : null
  }
  if (patch.autoSend !== undefined) dbPatch.auto_send = patch.autoSend

  const { error } = await supabase
    .from('pipeline_stage_task_template')
    .update(dbPatch)
    .eq('id', templateId)

  return { error: error?.message ?? null }
}

export async function deleteTaskTemplate(templateId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('pipeline_stage_task_template')
    .delete()
    .eq('id', templateId)

  return { error: error?.message ?? null }
}

export async function reorderTaskTemplates(
  templateIdsInOrder: string[]
): Promise<{ error: string | null }> {
  // N round-trips but reorders are rare and lists are short (typically <10 items per stage).
  for (let i = 0; i < templateIdsInOrder.length; i++) {
    const { error } = await supabase
      .from('pipeline_stage_task_template')
      .update({ display_order: i })
      .eq('id', templateIdsInOrder[i])
    if (error) return { error: error.message }
  }
  return { error: null }
}

// ── Application messages ─────────────────────────────────────────────────────

/**
 * Send the message attached to an application_task. The task's snapshotted
 * message fields are recorded as a permanent application_message row and the
 * task is marked complete + message_sent_at stamped. Pass `{ override }` to
 * send a customized subject/body (used by the manual-send modal where the
 * employer can tweak before sending).
 */
export async function sendApplicationMessage(
  applicationTaskId: string,
  opts: {
    override?: { subject?: string; body?: string; calendarLink?: string | null }
    silent?: boolean
  } = {}
): Promise<{ data: ApplicationMessage | null; error: string | null }> {
  const { data: task, error: tErr } = await supabase
    .from('application_task')
    .select('*')
    .eq('id', applicationTaskId)
    .single()
  if (tErr || !task) return { data: null, error: tErr?.message ?? 'not_found' }

  const subject = opts.override?.subject?.trim() || task.message_subject?.trim()
  const body = opts.override?.body?.trim() || task.message_body?.trim()
  if (!subject || !body) return { data: null, error: 'no_message' }
  const calendarLink =
    opts.override?.calendarLink !== undefined ? opts.override.calendarLink : task.calendar_link

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: inserted, error: insErr } = await supabase
    .from('application_message')
    .insert({
      application_id: task.application_id,
      application_task_id: task.id,
      subject,
      body,
      calendar_link: calendarLink ?? null,
      sent_by: user?.id ?? null,
    })
    .select('*')
    .single()
  if (insErr || !inserted) return { data: null, error: insErr?.message ?? 'insert_failed' }

  // Stamp message_sent_at, mark complete
  const now = new Date().toISOString()
  await supabase
    .from('application_task')
    .update({
      message_sent_at: now,
      completed_at: task.completed_at ?? now,
      completed_by: task.completed_by ?? user?.id ?? null,
    })
    .eq('id', task.id)

  if (!opts.silent) {
    await appendLog(task.application_id, {
      eventType: 'task_completed',
      actor: 'You',
      description: `Sent: ${subject}`,
    })
  } else {
    await appendLog(task.application_id, {
      eventType: 'task_completed',
      actor: 'System',
      description: `Auto-sent: ${subject}`,
    })
  }

  return { data: toMessage(inserted), error: null }
}

export async function getApplicationMessages(
  applicationId: string
): Promise<{ data: ApplicationMessage[]; error: string | null }> {
  const { data, error } = await supabase
    .from('application_message')
    .select('*')
    .eq('application_id', applicationId)
    .order('sent_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []).map(toMessage), error: null }
}

/**
 * Inbox query for the worker side: every message across every application this
 * worker has filed, joined with job title + company name + logo for display.
 * RLS scopes results to the worker's own applications.
 */
export type WorkerInboxMessage = ApplicationMessage & {
  jobId: string
  jobTitle: string
  companyId: string
  companyName: string
  companyLogo: string | null
}

export async function getWorkerMessages(): Promise<{
  data: WorkerInboxMessage[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('application_message')
    .select(
      `
      *,
      applications!inner(
        id,
        jobs!inner(
          id,
          title,
          company_profiles!inner(id, name, logo_url)
        )
      )
    `
    )
    .order('sent_at', { ascending: false })

  if (error) return { data: [], error: error.message }

  type JoinedMessage = MessageRow & {
    applications: {
      id: string
      jobs: {
        id: string
        title: string
        company_profiles: {
          id: string
          name: string
          logo_url: string | null
        }
      }
    }
  }

  const enriched = (data ?? []).map((row) => {
    const r = row as unknown as JoinedMessage
    const job = r.applications.jobs
    const company = job.company_profiles
    return {
      ...toMessage(r),
      jobId: job.id,
      jobTitle: job.title,
      companyId: company.id,
      companyName: company.name,
      companyLogo: company.logo_url,
    }
  })

  return { data: enriched, error: null }
}

export async function markMessageRead(messageId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('application_message')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId)
    .is('read_at', null)
  return { error: error?.message ?? null }
}

// ── Org-level pipeline (company_pipeline + pipeline_stage tables) ─────────────
//
// These functions read from the `pipeline_stage` table (joined via
// `company_pipeline`) which holds fully custom stage names set up during
// onboarding. This is distinct from `company_pipeline_stage` above which
// stores per-stage enable/disable/purpose/SLA config keyed on the enum type.
//
// `pipeline_stage` and `company_pipeline` are new tables added in migration
// 20260519000001 and are not yet in the generated database.types.ts. Cast
// the supabase client to bypass the type constraint.
const db = supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> }

export type PipelineStage = {
  id: string
  name: string
  sortOrder: number
}

type PipelineStageRow = { id: string; name: string; sort_order: number }

export async function getPipelineStages(
  companyId: string
): Promise<{ data: PipelineStage[]; error: string | null }> {
  const { data, error } = await db
    .from('pipeline_stage')
    .select('id, name, sort_order, company_pipeline!inner(company_id)')
    .eq('company_pipeline.company_id', companyId)
    .order('sort_order', { ascending: true })

  if (error) return { data: [], error: error.message }

  return {
    data: (data ?? []).map((r: unknown) => {
      const row = r as PipelineStageRow
      return { id: row.id, name: row.name, sortOrder: row.sort_order }
    }),
    error: null,
  }
}

async function getOrgPipelineId(companyId: string): Promise<string | null> {
  const { data } = await db
    .from('company_pipeline')
    .select('id')
    .eq('company_id', companyId)
    .single()
  return (data as unknown as { id: string } | null)?.id ?? null
}

export async function addPipelineStage(
  companyId: string,
  name: string
): Promise<{ data: PipelineStage | null; error: string | null }> {
  const pipelineId = await getOrgPipelineId(companyId)
  if (!pipelineId) return { data: null, error: 'No pipeline found for this company.' }

  const { data: existing } = await db
    .from('pipeline_stage')
    .select('sort_order')
    .eq('pipeline_id', pipelineId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = ((existing as unknown as PipelineStageRow | null)?.sort_order ?? 0) + 1

  const { data, error } = await db
    .from('pipeline_stage')
    .insert({ pipeline_id: pipelineId, name: name.trim(), sort_order: nextOrder })
    .select('id, name, sort_order')
    .single()

  if (error) return { data: null, error: error.message }
  const r = data as unknown as PipelineStageRow
  return { data: { id: r.id, name: r.name, sortOrder: r.sort_order }, error: null }
}

export async function renamePipelineStage(
  stageId: string,
  name: string
): Promise<{ error: string | null }> {
  const { error } = await db.from('pipeline_stage').update({ name: name.trim() }).eq('id', stageId)
  return { error: error?.message ?? null }
}

export async function removePipelineStage(stageId: string): Promise<{ error: string | null }> {
  const { count } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('current_stage_id', stageId)
    .eq('status', 'active')

  if (count && count > 0) {
    return {
      error: `${count} active application${count === 1 ? ' is' : 's are'} currently in this stage. Move them first.`,
    }
  }

  const { error } = await db.from('pipeline_stage').delete().eq('id', stageId)
  return { error: error?.message ?? null }
}

export type PipelineTemplate = 'short' | 'long' | 'build_your_own'

type TemplateSeedStage = { name: string; sort_order: number }
type TemplateSeed = { stages: TemplateSeedStage[] }

const PIPELINE_TEMPLATES: Record<'short' | 'long', TemplateSeed> = {
  short: shortTemplate as TemplateSeed,
  long: longTemplate as TemplateSeed,
}

async function ensureOrgPipelineExists(companyId: string): Promise<string | null> {
  const id = await getOrgPipelineId(companyId)
  if (id) return id
  const { data } = await db
    .from('company_pipeline')
    .insert({ company_id: companyId })
    .select('id')
    .single()
  return (data as unknown as { id: string } | null)?.id ?? null
}

export async function replacePipelineFromTemplate(
  companyId: string,
  template: PipelineTemplate
): Promise<{ error: string | null }> {
  const pipelineId = await ensureOrgPipelineExists(companyId)
  if (!pipelineId) return { error: 'Could not create pipeline for this company.' }

  const { data: existingRaw } = await db
    .from('pipeline_stage')
    .select('id, sort_order')
    .eq('pipeline_id', pipelineId)
    .order('sort_order', { ascending: true })
  const existing = (existingRaw ?? []) as unknown as Array<{ id: string; sort_order: number }>

  let newStages: Array<{ id: string; pipeline_id: string; name: string; sort_order: number }>
  if (template === 'build_your_own') {
    newStages = [
      { id: crypto.randomUUID(), pipeline_id: pipelineId, name: 'Applied', sort_order: 1 },
    ]
  } else {
    const seed = PIPELINE_TEMPLATES[template]
    newStages = seed.stages.map((s, i) => ({
      id: crypto.randomUUID(),
      pipeline_id: pipelineId,
      name: s.name,
      sort_order: i + 1,
    }))
  }

  // Remap applicants from old stage ids to new stage ids by matching sort_order.
  // Any old stage with no matching sort_order falls through to the last new stage,
  // so applicants are never orphaned when switching to a shorter pipeline.
  const lastNewId = newStages[newStages.length - 1].id
  const newBySortOrder = new Map(newStages.map((s) => [s.sort_order, s.id]))
  for (const old of existing) {
    const targetId = newBySortOrder.get(old.sort_order) ?? lastNewId
    if (old.id === targetId) continue
    const { error } = await supabase
      .from('applications')
      .update({ current_stage_id: targetId } as unknown as Record<string, unknown>)
      .eq('current_stage_id', old.id)
    if (error) return { error: `Failed to remap applicants: ${error.message}` }
  }

  const { error: deleteError } = await db
    .from('pipeline_stage')
    .delete()
    .eq('pipeline_id', pipelineId)
  if (deleteError) return { error: deleteError.message }

  const { error: insertError } = await db.from('pipeline_stage').insert(newStages)
  return { error: insertError?.message ?? null }
}
