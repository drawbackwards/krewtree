import { supabase } from '../../lib/supabase'
import type { ApplicationTask } from '../types'

// ── Types ──────────────────────────────────────────────────────────────────

export type LogEntry = {
  id: string
  applicationId: string
  eventType: string
  actor: string
  description: string
  createdAt: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

function toTask(row: Record<string, unknown>): ApplicationTask {
  const completedAt = (row.completed_at as string | null) ?? null
  const skippedAt = (row.skipped_at as string | null) ?? null
  const state = completedAt ? 'completed' : skippedAt ? 'skipped' : 'incomplete'

  return {
    id: row.id as string,
    applicationId: row.application_id as string,
    stageId: row.stage_id as string,
    source: row.source as 'template' | 'ad_hoc',
    templateTaskId: (row.template_task_id as string | null) ?? null,
    label: row.label as string,
    isRequired: row.is_required as boolean,
    state,
    completedAt,
    completedBy: (row.completed_by as string | null) ?? null,
    skippedAt,
    skippedBy: (row.skipped_by as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    dueDate: (row.due_date as string | null) ?? null,
    order: row.display_order as number,
    createdAt: row.created_at as string,
    messageSubject: (row.message_subject as string | null) ?? null,
    messageBody: (row.message_body as string | null) ?? null,
    calendarLink: (row.calendar_link as string | null) ?? null,
    autoSend: (row.auto_send as boolean | null) ?? false,
    messageSentAt: (row.message_sent_at as string | null) ?? null,
  }
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

// ── Task queries ────────────────────────────────────────────────────────────

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
    .order('created_at', { ascending: true })

  if (error) return { data: [], error: error.message }
  return {
    data: (data ?? []).map((row) => toTask(row as unknown as Record<string, unknown>)),
    error: null,
  }
}

export async function completeTask(taskId: string): Promise<{ error: string | null }> {
  const uid = await currentUserId()
  const { error } = await supabase
    .from('application_task')
    .update({
      completed_at: new Date().toISOString(),
      completed_by: uid,
      skipped_at: null,
      skipped_by: null,
    })
    .eq('id', taskId)
  return { error: error?.message ?? null }
}

export async function uncompleteTask(taskId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('application_task')
    .update({ completed_at: null, completed_by: null })
    .eq('id', taskId)
  return { error: error?.message ?? null }
}

export async function skipTask(taskId: string): Promise<{ error: string | null }> {
  const uid = await currentUserId()
  const { error } = await supabase
    .from('application_task')
    .update({
      skipped_at: new Date().toISOString(),
      skipped_by: uid,
      completed_at: null,
      completed_by: null,
    })
    .eq('id', taskId)
  return { error: error?.message ?? null }
}

export async function unskipTask(taskId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('application_task')
    .update({ skipped_at: null, skipped_by: null })
    .eq('id', taskId)
  return { error: error?.message ?? null }
}

export async function updateTaskNotes(
  taskId: string,
  notes: string | null
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('application_task')
    .update({ notes: notes || null })
    .eq('id', taskId)
  return { error: error?.message ?? null }
}

export async function updateTaskDueDate(
  taskId: string,
  dueDate: string | null
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('application_task')
    .update({ due_date: dueDate })
    .eq('id', taskId)
  return { error: error?.message ?? null }
}

export async function updateAdHocTask(
  taskId: string,
  updates: { label?: string; isRequired?: boolean; dueDate?: string | null }
): Promise<{ error: string | null }> {
  const patch: Record<string, unknown> = {}
  if (updates.label !== undefined) patch.label = updates.label
  if (updates.isRequired !== undefined) patch.is_required = updates.isRequired
  if (updates.dueDate !== undefined) patch.due_date = updates.dueDate ?? null
  const { error } = await supabase.from('application_task').update(patch).eq('id', taskId)
  return { error: error?.message ?? null }
}

export async function addAdHocTask(
  applicationId: string,
  stageId: string,
  label: string,
  isRequired: boolean,
  dueDate?: string
): Promise<{ data: ApplicationTask | null; error: string | null }> {
  const { data, error } = await supabase
    .from('application_task')
    .insert({
      application_id: applicationId,
      stage_id: stageId,
      source: 'ad_hoc',
      label,
      is_required: isRequired,
      due_date: dueDate ?? null,
      display_order: 9999,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: toTask(data as unknown as Record<string, unknown>), error: null }
}

export async function deleteTask(taskId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('application_task').delete().eq('id', taskId)
  return { error: error?.message ?? null }
}

// ── Stage notes ────────────────────────────────────────────────────────────

export async function getStageNotes(
  applicationId: string,
  stageId: string
): Promise<{ notes: string; error: string | null }> {
  const { data, error } = await supabase
    .from('application_stage_notes')
    .select('notes')
    .eq('application_id', applicationId)
    .eq('stage_id', stageId)
    .maybeSingle()

  if (error) return { notes: '', error: error.message }
  return { notes: (data?.notes as string | null) ?? '', error: null }
}

export async function saveStageNotes(
  applicationId: string,
  stageId: string,
  notes: string
): Promise<{ error: string | null }> {
  const uid = await currentUserId()
  const { error } = await supabase.from('application_stage_notes').upsert(
    {
      application_id: applicationId,
      stage_id: stageId,
      notes: notes || null,
      updated_by: uid,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'application_id,stage_id' }
  )
  return { error: error?.message ?? null }
}

// ── Event log ──────────────────────────────────────────────────────────────

export async function getApplicationLog(
  applicationId: string,
  limit = 100
): Promise<{ data: LogEntry[]; error: string | null }> {
  const { data, error } = await supabase
    .from('application_log')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: [], error: error.message }
  return {
    data: (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      applicationId: row.application_id as string,
      eventType: row.event_type as string,
      actor: row.actor as string,
      description: row.description as string,
      createdAt: row.created_at as string,
    })),
    error: null,
  }
}

export async function writeLogEvent(
  applicationId: string,
  eventType: string,
  description: string,
  actor: string,
  actorId?: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('application_log').insert({
    application_id: applicationId,
    event_type: eventType,
    actor,
    actor_id: actorId ?? null,
    description,
  })
  return { error: error?.message ?? null }
}
