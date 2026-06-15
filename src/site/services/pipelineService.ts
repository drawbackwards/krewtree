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
  ApplicationTaskNote,
  ApplicationLogEvent,
  ApplicationMessage,
  StageNote,
  TaskState,
  LogEventType,
} from '../types'
import { supabase, getCurrentUserId } from '../../lib/supabase'
import type { Database } from '../../lib/database.types'
import shortTemplate from '../../../seeds/pipeline-templates/short.json'
import longTemplate from '../../../seeds/pipeline-templates/long.json'

type TaskRow = Database['public']['Tables']['application_task']['Row']
type TaskNoteRow = Database['public']['Tables']['application_task_note']['Row']
type NoteRow = Database['public']['Tables']['application_stage_notes']['Row']
type LogRow = Database['public']['Tables']['application_log']['Row']
type TemplateRow = Database['public']['Tables']['pipeline_stage_task_template']['Row']
type MessageRow = Database['public']['Tables']['message']['Row']

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
    // Pipeline sends always carry application context; the unified
    // message table allows null only for plain chat messages.
    applicationId: row.application_id ?? '',
    applicationTaskId: row.application_task_id,
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
    stageId: row.stage_id ?? '',
    source: row.source as ApplicationTask['source'],
    templateTaskId: row.template_task_id,
    label: row.label,
    isRequired: row.is_required,
    state: row.completed_at ? 'completed' : row.skipped_at ? 'skipped' : 'incomplete',
    completedAt: row.completed_at,
    completedBy: row.completed_by,
    skippedAt: row.skipped_at,
    skippedBy: row.skipped_by,
    notes: [],
    dueDate: row.due_date,
    order: row.display_order,
    createdAt: row.created_at,
    messageSubject: row.message_subject,
    messageBody: row.message_body,
    calendarLink: row.calendar_link,
    autoSend: row.auto_send,
    messageSentAt: row.message_sent_at,
    flagged: row.is_flagged,
  }
}

function toTaskNote(row: TaskNoteRow): ApplicationTaskNote {
  return {
    id: row.id,
    applicationTaskId: row.application_task_id,
    applicationId: row.application_id,
    body: row.body,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  }
}

function toNote(row: NoteRow): StageNote {
  return {
    applicationId: row.application_id,
    stageId: row.stage_id ?? '',
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
    taskLabel: row.task_label,
    noteBody: row.note_body,
    stageId: row.stage_id,
    createdAt: row.created_at,
  }
}

// ── Best-effort log append ───────────────────────────────────────────────────

async function appendLog(
  applicationId: string,
  event: {
    eventType: LogEventType
    actor: string
    description: string
    stageId?: string | null
    taskLabel?: string | null
    noteBody?: string | null
  }
): Promise<void> {
  await supabase.from('application_log').insert({
    application_id: applicationId,
    event_type: event.eventType,
    actor: event.actor,
    description: event.description,
    stage_id: event.stageId ?? null,
    task_label: event.taskLabel ?? null,
    note_body: event.noteBody ?? null,
  })
}

// ── Task queries ─────────────────────────────────────────────────────────────

export async function getApplicationTasks(
  applicationId: string,
  stageId: string
): Promise<{ data: ApplicationTask[]; error: string | null }> {
  // Tasks + their notes in one round trip via an embedded select, ordered so
  // notes read oldest-first within each task.
  const { data, error } = await supabase
    .from('application_task')
    .select('*, application_task_note(*)')
    .eq('application_id', applicationId)
    .eq('stage_id', stageId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true, referencedTable: 'application_task_note' })

  if (error) return { data: [], error: error.message }

  const rows = (data ?? []) as unknown as Array<TaskRow & { application_task_note: TaskNoteRow[] }>
  const tasks = rows.map((row) => {
    const task = toTask(row)
    task.notes = (row.application_task_note ?? []).map(toTaskNote)
    return task
  })

  return { data: tasks, error: null }
}

// ── Task mutations ───────────────────────────────────────────────────────────

export async function toggleTaskComplete(
  applicationId: string,
  taskId: string,
  completed: boolean
): Promise<{ error: string | null }> {
  const userId = await getCurrentUserId()

  const patch = completed
    ? {
        completed_at: new Date().toISOString(),
        completed_by: userId,
        skipped_at: null,
        skipped_by: null,
      }
    : { completed_at: null, completed_by: null }

  const { data, error } = await supabase
    .from('application_task')
    .update(patch)
    .eq('id', taskId)
    .eq('application_id', applicationId)
    .select('stage_id, label')
    .single()

  if (error) return { error: error.message }

  const label = data?.label ?? 'Task'
  await appendLog(applicationId, {
    eventType: completed ? 'task_completed' : 'task_uncompleted',
    actor: 'You',
    description: completed ? `${label} completed` : `${label} marked incomplete`,
    stageId: data?.stage_id ?? null,
    taskLabel: label,
  })

  return { error: null }
}

export async function toggleTaskSkip(
  applicationId: string,
  taskId: string,
  skipped: boolean
): Promise<{ error: string | null }> {
  const userId = await getCurrentUserId()

  const patch = skipped
    ? {
        skipped_at: new Date().toISOString(),
        skipped_by: userId,
        completed_at: null,
        completed_by: null,
      }
    : { skipped_at: null, skipped_by: null }

  const { data, error } = await supabase
    .from('application_task')
    .update(patch)
    .eq('id', taskId)
    .eq('application_id', applicationId)
    .select('stage_id, label')
    .single()

  if (error) return { error: error.message }

  const label = data?.label ?? 'Task'
  await appendLog(applicationId, {
    eventType: skipped ? 'task_skipped' : 'task_unskipped',
    actor: 'You',
    description: skipped ? `${label} skipped` : `${label} unskipped`,
    stageId: data?.stage_id ?? null,
    taskLabel: label,
  })

  return { error: null }
}

export async function toggleTaskFlag(
  applicationId: string,
  taskId: string,
  flagged: boolean
): Promise<{ error: string | null }> {
  const { data, error } = await supabase
    .from('application_task')
    .update({ is_flagged: flagged })
    .eq('id', taskId)
    .eq('application_id', applicationId)
    .select('stage_id, label')
    .single()

  if (error) return { error: error.message }

  const label = data?.label ?? 'Task'
  await appendLog(applicationId, {
    eventType: flagged ? 'task_flagged' : 'task_unflagged',
    actor: 'You',
    description: flagged ? `${label} flagged for follow-up` : `${label} unflagged`,
    stageId: data?.stage_id ?? null,
    taskLabel: label,
  })

  return { error: null }
}

export async function addTaskNote(
  applicationId: string,
  taskId: string,
  body: string
): Promise<{ data: ApplicationTaskNote | null; error: string | null }> {
  const trimmed = body.trim()
  if (!trimmed) return { data: null, error: 'empty_note' }

  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('application_task_note')
    .insert({
      application_task_id: taskId,
      application_id: applicationId,
      body: trimmed,
      created_by: userId,
    })
    .select('*')
    .single()

  if (error || !data) return { data: null, error: error?.message ?? 'insert_failed' }

  const { data: taskRow } = await supabase
    .from('application_task')
    .select('label, stage_id')
    .eq('id', taskId)
    .single()

  await appendLog(applicationId, {
    eventType: 'task_note_added',
    actor: 'You',
    description: taskRow?.label ? `Note added on ${taskRow.label}` : 'Note added',
    stageId: taskRow?.stage_id ?? null,
    taskLabel: taskRow?.label ?? null,
    noteBody: trimmed,
  })

  return { data: toTaskNote(data), error: null }
}

export async function editTaskNote(
  applicationId: string,
  noteId: string,
  body: string
): Promise<{ data: ApplicationTaskNote | null; error: string | null }> {
  const trimmed = body.trim()
  if (!trimmed) return { data: null, error: 'empty_note' }

  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('application_task_note')
    .update({
      body: trimmed,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq('id', noteId)
    .eq('application_id', applicationId)
    .select('*')
    .single()

  if (error || !data) return { data: null, error: error?.message ?? 'update_failed' }

  const { data: taskRow } = await supabase
    .from('application_task')
    .select('label, stage_id')
    .eq('id', data.application_task_id)
    .single()

  await appendLog(applicationId, {
    eventType: 'task_note_edited',
    actor: 'You',
    description: taskRow?.label ? `Note edited on ${taskRow.label}` : 'Note edited',
    stageId: taskRow?.stage_id ?? null,
    taskLabel: taskRow?.label ?? null,
    noteBody: trimmed,
  })

  return { data: toTaskNote(data), error: null }
}

export async function addAdHocTask(
  applicationId: string,
  stageId: string,
  label: string,
  isRequired: boolean
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
      display_order: count ?? 0,
    })
    .select('*')
    .single()

  if (error) return { data: null, error: error.message }

  await appendLog(applicationId, {
    eventType: 'task_created',
    actor: 'You',
    description: `${label} added`,
    stageId,
    taskLabel: label,
  })

  return { data: toTask(data), error: null }
}

export async function deleteAdHocTask(
  applicationId: string,
  taskId: string
): Promise<{ error: string | null }> {
  const { data: existing, error: fetchErr } = await supabase
    .from('application_task')
    .select('label, source, stage_id')
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
    description: `${existing.label} deleted`,
    stageId: existing.stage_id ?? null,
    taskLabel: existing.label,
  })

  return { error: null }
}

export async function editAdHocTask(
  applicationId: string,
  taskId: string,
  patch: { label?: string; isRequired?: boolean }
): Promise<{ error: string | null }> {
  const dbPatch: Record<string, unknown> = {}
  if (patch.label !== undefined) dbPatch.label = patch.label
  if (patch.isRequired !== undefined) dbPatch.is_required = patch.isRequired

  const { error } = await supabase
    .from('application_task')
    .update(dbPatch)
    .eq('id', taskId)
    .eq('application_id', applicationId)
    .eq('source', 'ad_hoc')

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
  const userId = await getCurrentUserId()

  const { error } = await supabase.from('application_stage_notes').upsert(
    {
      application_id: applicationId,
      stage_id: stageId,
      notes: notes.trim() || null,
      updated_by: userId,
    },
    { onConflict: 'application_id,stage_id' }
  )

  if (error) return { error: error.message }

  await appendLog(applicationId, {
    eventType: 'stage_notes_updated',
    actor: 'You',
    description: 'Stage notes updated',
    stageId,
    noteBody: notes.trim() || null,
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

export async function addLogNote(
  applicationId: string,
  body: string
): Promise<{ data: ApplicationLogEvent | null; error: string | null }> {
  const trimmed = body.trim()
  if (!trimmed) return { data: null, error: 'empty_note' }

  const { data, error } = await supabase
    .from('application_log')
    .insert({
      application_id: applicationId,
      event_type: 'note_added',
      actor: 'You',
      description: 'Note added',
      note_body: trimmed,
      stage_id: null,
    })
    .select('*')
    .single()

  if (error || !data) return { data: null, error: error?.message ?? 'insert_failed' }
  return { data: toLogEvent(data), error: null }
}

// ── Task state helper ────────────────────────────────────────────────────────

export function getTaskState(task: ApplicationTask): TaskState {
  return task.state
}

// ── Stage-advancement gating ──────────────────────────────────────────────────
//
// A required task blocks advancing to a later stage until it is completed or
// explicitly skipped. Skipping clears the "Required" pill in the UI, so a
// skipped required task is treated as resolved — only 'incomplete' ones block.

export function countBlockingRequiredTasks(tasks: ApplicationTask[]): number {
  return tasks.filter((t) => t.isRequired && t.state === 'incomplete').length
}

export async function getBlockingRequiredCount(
  applicationId: string,
  stageId: string
): Promise<number> {
  const { data } = await getApplicationTasks(applicationId, stageId)
  return countBlockingRequiredTasks(data)
}

// True when `toStageId` sits later in the pipeline than `fromStageId`. Backward
// and sideways moves are never gated — only forward advancement is.
export function isForwardStageMove(
  stages: PipelineStage[],
  fromStageId: string,
  toStageId: string
): boolean {
  const from = stages.find((s) => s.id === fromStageId)
  const to = stages.find((s) => s.id === toStageId)
  if (!from || !to) return false
  return to.sortOrder > from.sortOrder
}

// ── Template instantiation ───────────────────────────────────────────────────

/**
 * Copies the company's task templates for `stage` into application_task rows
 * for this applicant. No-op if the applicant already has any template-sourced
 * tasks for that stage (so re-entering a stage doesn't duplicate work).
 *
 * Only active stages have templates — terminal stages skip silently.
 */
const instantiateInflight = new Map<string, Promise<{ inserted: number; error: string | null }>>()

export async function instantiateTemplatesForStage(
  applicationId: string,
  stageId: string
): Promise<{ inserted: number; error: string | null }> {
  const key = `${applicationId}:${stageId}`
  const existing = instantiateInflight.get(key)
  if (existing) return existing
  const promise = instantiateTemplatesForStageImpl(applicationId, stageId).finally(() => {
    instantiateInflight.delete(key)
  })
  instantiateInflight.set(key, promise)
  return promise
}

async function instantiateTemplatesForStageImpl(
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
 * message fields are recorded as a permanent row on the unified `message`
 * table (tagged with the application context) and the task is marked
 * complete + message_sent_at stamped. Pass `{ override }` to send a
 * customized subject/body (used by the manual-send modal where the
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
    .select('*, applications!inner(company_id, worker_id)')
    .eq('id', applicationTaskId)
    .single()
  if (tErr || !task) return { data: null, error: tErr?.message ?? 'not_found' }
  const pair = (task as unknown as { applications: { company_id: string; worker_id: string } })
    .applications

  const subject = opts.override?.subject?.trim() || task.message_subject?.trim()
  const body = opts.override?.body?.trim() || task.message_body?.trim()
  if (!subject || !body) return { data: null, error: 'no_message' }
  const calendarLink =
    opts.override?.calendarLink !== undefined ? opts.override.calendarLink : task.calendar_link

  const userId = await getCurrentUserId()
  if (!userId) return { data: null, error: 'not_authenticated' }

  // The subject stays an internal label (task list, "Sent:" log entries);
  // only the body ships on the message.
  const { data: inserted, error: insErr } = await supabase
    .from('message')
    .insert({
      company_id: pair.company_id,
      worker_id: pair.worker_id,
      application_id: task.application_id,
      application_task_id: task.id,
      body,
      calendar_link: calendarLink ?? null,
      sent_by: userId,
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
      completed_by: task.completed_by ?? userId,
    })
    .eq('id', task.id)

  if (!opts.silent) {
    await appendLog(task.application_id, {
      eventType: 'task_completed',
      actor: 'You',
      description: `Sent: ${subject}`,
      stageId: task.stage_id ?? null,
      taskLabel: task.label ?? null,
    })
  } else {
    await appendLog(task.application_id, {
      eventType: 'task_completed',
      actor: 'System',
      description: `Auto-sent: ${subject}`,
      stageId: task.stage_id ?? null,
      taskLabel: task.label ?? null,
    })
  }

  return { data: toMessage(inserted), error: null }
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
  isActive: boolean
}

type PipelineStageRow = { id: string; name: string; sort_order: number; is_active: boolean }

// Session cache for the active-stages read, keyed by companyId. Stages change
// only via the settings mutations below, each of which calls clearStageCache(),
// so a cached read can't go stale within a session. Only the default
// (active-only) variant is cached; includeInactive reads always hit the DB so
// the settings editor sees fresh state.
const activeStagesCache = new Map<string, PipelineStage[]>()

export function clearStageCache(companyId?: string): void {
  if (companyId) activeStagesCache.delete(companyId)
  else activeStagesCache.clear()
}

export async function getPipelineStages(
  companyId: string,
  opts: { includeInactive?: boolean } = {}
): Promise<{ data: PipelineStage[]; error: string | null }> {
  if (!opts.includeInactive) {
    const cached = activeStagesCache.get(companyId)
    if (cached) return { data: [...cached], error: null }
  }

  let query = db
    .from('pipeline_stage')
    .select('id, name, sort_order, is_active, company_pipeline!inner(company_id)')
    .eq('company_pipeline.company_id', companyId)
    .order('sort_order', { ascending: true })

  if (!opts.includeInactive) query = query.eq('is_active', true)

  const { data, error } = await query

  if (error) return { data: [], error: error.message }

  const stages = (data ?? []).map((r: unknown) => {
    const row = r as PipelineStageRow
    return {
      id: row.id,
      name: row.name,
      sortOrder: row.sort_order,
      isActive: row.is_active,
    }
  })

  if (!opts.includeInactive) activeStagesCache.set(companyId, stages)

  return { data: [...stages], error: null }
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
    .select('id, name, sort_order, is_active')
    .single()

  if (error) return { data: null, error: error.message }
  clearStageCache(companyId)
  const r = data as unknown as PipelineStageRow
  return {
    data: { id: r.id, name: r.name, sortOrder: r.sort_order, isActive: r.is_active },
    error: null,
  }
}

export async function renamePipelineStage(
  stageId: string,
  name: string
): Promise<{ error: string | null }> {
  const { error } = await db.from('pipeline_stage').update({ name: name.trim() }).eq('id', stageId)
  if (!error) clearStageCache()
  return { error: error?.message ?? null }
}

export async function setPipelineStageActive(
  stageId: string,
  isActive: boolean
): Promise<{ error: string | null }> {
  if (!isActive) {
    const count = await countActiveApplicationsInStage(stageId)
    if (count > 0) {
      return {
        error: `${count} active application${count === 1 ? ' is' : 's are'} currently in this stage. Move them first.`,
      }
    }
  }

  const { error } = await db
    .from('pipeline_stage')
    .update({ is_active: isActive })
    .eq('id', stageId)
  if (!error) clearStageCache()
  return { error: error?.message ?? null }
}

export async function countActiveApplicationsInStage(stageId: string): Promise<number> {
  const { count } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('current_stage_id', stageId)
    .eq('status', 'active')
  return count ?? 0
}

export async function bulkMoveApplicationsBetweenStages(
  fromStageId: string,
  toStageId: string
): Promise<{ moved: number; error: string | null }> {
  if (fromStageId === toStageId) return { moved: 0, error: 'same_stage' }

  const { data, error } = await supabase
    .from('applications')
    .update({ current_stage_id: toStageId } as unknown as Record<string, unknown>)
    .eq('current_stage_id', fromStageId)
    .eq('status', 'active')
    .select('id')

  if (error) return { moved: 0, error: error.message }
  return { moved: data?.length ?? 0, error: null }
}

export async function reorderPipelineStages(
  stageIdsInOrder: string[]
): Promise<{ error: string | null }> {
  for (let i = 0; i < stageIdsInOrder.length; i++) {
    const { error } = await db
      .from('pipeline_stage')
      .update({ sort_order: i + 1 })
      .eq('id', stageIdsInOrder[i])
    if (error) return { error: error.message }
  }
  clearStageCache()
  return { error: null }
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

  // Task templates reference the stage by id but have no FK cascade, so remove them explicitly.
  const { error: tplError } = await supabase
    .from('pipeline_stage_task_template')
    .delete()
    .eq('stage_id', stageId)
  if (tplError) return { error: tplError.message }

  const { error } = await db.from('pipeline_stage').delete().eq('id', stageId)
  if (!error) clearStageCache()
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
  if (!insertError) clearStageCache(companyId)
  return { error: insertError?.message ?? null }
}
