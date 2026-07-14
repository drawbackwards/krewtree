// ============================================================
// KREWTREE — Message Template Service
// Named, reusable message bodies scoped to a company. Consumed in
// the message composers (insert body for editing before send) and
// attachable to pipeline task templates. Mirrors the job_templates
// service shape. Any links live inline in the body. Each function
// returns { data, error }.
// ============================================================

import { supabase } from '../../lib/supabase'
import type { Database } from '../../lib/database.types'

type MessageTemplateRow = Database['public']['Tables']['message_templates']['Row']

export type MessageTemplateKind = 'custom' | 'rejection'

export type MessageTemplate = {
  id: string
  name: string
  body: string
  createdAt: string
  /** 'rejection' = the reserved template linked to the reject modal (name
   *  locked, not deletable). 'custom' = an ordinary user template. */
  kind: MessageTemplateKind
}

/** Fixed display name of the reserved rejection template (title is not editable). */
export const REJECTION_TEMPLATE_NAME = 'Rejection notification'

/** Fallback body if the reserved row is somehow missing (kept in sync with the
 *  SQL `default_rejection_template_body()` used to seed it). */
export const DEFAULT_REJECTION_TEMPLATE_BODY = `Thank you for taking the time to apply and for your interest in this role.

After careful consideration, we have decided to move forward with other candidates at this time. This was a difficult decision and is not a reflection of your experience or effort.

We would genuinely welcome a future application from you and wish you the very best in your search.`

function toTemplate(row: MessageTemplateRow): MessageTemplate {
  return {
    id: row.id,
    name: row.name,
    body: row.body,
    createdAt: row.created_at,
    kind: row.kind === 'rejection' ? 'rejection' : 'custom',
  }
}

export async function getMessageTemplates(
  companyId: string
): Promise<{ data: MessageTemplate[]; error: string | null }> {
  const { data, error } = await supabase
    .from('message_templates')
    .select('id, name, body, created_at, kind')
    .eq('company_id', companyId)
    .order('name', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []).map((r) => toTemplate(r as MessageTemplateRow)), error: null }
}

/**
 * Returns the company's reserved rejection template body — what the reject
 * modal sends when the "send a rejection message" box is checked. Falls back to
 * the code default if the reserved row is missing.
 */
export async function getRejectionTemplate(
  companyId: string
): Promise<{ data: { id: string | null; body: string }; error: string | null }> {
  const { data, error } = await supabase
    .from('message_templates')
    .select('id, body')
    .eq('company_id', companyId)
    .eq('kind', 'rejection')
    .maybeSingle()

  if (error)
    return { data: { id: null, body: DEFAULT_REJECTION_TEMPLATE_BODY }, error: error.message }
  if (!data) return { data: { id: null, body: DEFAULT_REJECTION_TEMPLATE_BODY }, error: null }
  return { data: { id: data.id, body: data.body }, error: null }
}

export async function createMessageTemplate(
  companyId: string,
  input: { name: string; body: string }
): Promise<{ data: MessageTemplate | null; error: string | null }> {
  const name = input.name.trim()
  const body = input.body.trim()
  if (!name) return { data: null, error: 'empty_name' }
  if (!body) return { data: null, error: 'empty_body' }

  const { data, error } = await supabase
    .from('message_templates')
    .insert({ company_id: companyId, name, body })
    .select('id, name, body, created_at, kind')
    .single()

  if (error || !data) return { data: null, error: error?.message ?? 'insert_failed' }
  return { data: toTemplate(data as MessageTemplateRow), error: null }
}

export type MessageTemplatePatch = {
  name?: string
  body?: string
}

export async function updateMessageTemplate(
  id: string,
  patch: MessageTemplatePatch
): Promise<{ data: MessageTemplate | null; error: string | null }> {
  const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.name !== undefined) {
    const v = patch.name.trim()
    if (!v) return { data: null, error: 'empty_name' }
    dbPatch.name = v
  }
  if (patch.body !== undefined) {
    const v = patch.body.trim()
    if (!v) return { data: null, error: 'empty_body' }
    dbPatch.body = v
  }

  const { data, error } = await supabase
    .from('message_templates')
    .update(dbPatch)
    .eq('id', id)
    .select('id, name, body, created_at, kind')
    .single()

  if (error || !data) return { data: null, error: error?.message ?? 'update_failed' }
  return { data: toTemplate(data as MessageTemplateRow), error: null }
}

export async function deleteMessageTemplate(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('message_templates').delete().eq('id', id)
  return { error: error?.message ?? null }
}
