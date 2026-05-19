import { supabase } from '../../lib/supabase'
import type { KanbanStage } from '../types'

// ── Types ──────────────────────────────────────────────────────────────────

export type ApplicationTask = {
  id: string
  applicationId: string
  stageType: KanbanStage
  source: 'template' | 'ad_hoc'
  templateTaskId: string | null
  label: string
  isRequired: boolean
  completedAt: string | null
  completedBy: string | null
  skippedAt: string | null
  skippedBy: string | null
  notes: string | null
  dueDate: string | null
  displayOrder: number
  createdAt: string
}

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
  return {
    id: row.id as string,
    applicationId: row.application_id as string,
    stageType: row.stage_type as KanbanStage,
    source: row.source as 'template' | 'ad_hoc',
    templateTaskId: (row.template_task_id as string | null) ?? null,
    label: row.label as string,
    isRequired: row.is_required as boolean,
    completedAt: (row.completed_at as string | null) ?? null,
    completedBy: (row.completed_by as string | null) ?? null,
    skippedAt: (row.skipped_at as string | null) ?? null,
    skippedBy: (row.skipped_by as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    dueDate: (row.due_date as string | null) ?? null,
    displayOrder: row.display_order as number,
    createdAt: row.created_at as string,
  }
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

// ── Task queries ────────────────────────────────────────────────────────────

export async function getApplicationTasks(
  applicationId: string,
  stageType: KanbanStage
): Promise<{ data: ApplicationTask[]; error: string | null }> {
  const { data, error } = await supabase
    .from('application_task')
    .select('*')
    .eq('application_id', applicationId)
    .eq('stage_type', stageType as unknown as 'screening')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []).map(toTask), error: null }
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
  stageType: KanbanStage,
  label: string,
  isRequired: boolean,
  dueDate?: string
): Promise<{ data: ApplicationTask | null; error: string | null }> {
  const { data, error } = await supabase
    .from('application_task')
    .insert({
      application_id: applicationId,
      stage_type: stageType as 'screening',
      source: 'ad_hoc',
      label,
      is_required: isRequired,
      due_date: dueDate ?? null,
      display_order: 9999,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: toTask(data), error: null }
}

export async function deleteTask(taskId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('application_task').delete().eq('id', taskId)
  return { error: error?.message ?? null }
}

// ── Stage notes ────────────────────────────────────────────────────────────

export async function getStageNotes(
  applicationId: string,
  stageType: KanbanStage
): Promise<{ notes: string; error: string | null }> {
  const { data, error } = await supabase
    .from('application_stage_notes')
    .select('notes')
    .eq('application_id', applicationId)
    .eq('stage_type', stageType as unknown as 'screening')
    .maybeSingle()

  if (error) return { notes: '', error: error.message }
  return { notes: (data?.notes as string | null) ?? '', error: null }
}

export async function saveStageNotes(
  applicationId: string,
  stageType: KanbanStage,
  notes: string
): Promise<{ error: string | null }> {
  const uid = await currentUserId()
  const { error } = await supabase.from('application_stage_notes').upsert(
    {
      application_id: applicationId,
      stage_type: stageType,
      notes: notes || null,
      updated_by: uid,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'application_id,stage_type' }
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
