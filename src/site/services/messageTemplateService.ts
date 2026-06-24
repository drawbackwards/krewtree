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

export type MessageTemplate = {
  id: string
  name: string
  body: string
  createdAt: string
}

function toTemplate(row: MessageTemplateRow): MessageTemplate {
  return {
    id: row.id,
    name: row.name,
    body: row.body,
    createdAt: row.created_at,
  }
}

export async function getMessageTemplates(
  companyId: string
): Promise<{ data: MessageTemplate[]; error: string | null }> {
  const { data, error } = await supabase
    .from('message_templates')
    .select('id, name, body, created_at')
    .eq('company_id', companyId)
    .order('name', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []).map((r) => toTemplate(r as MessageTemplateRow)), error: null }
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
    .select('id, name, body, created_at')
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
    .select('id, name, body, created_at')
    .single()

  if (error || !data) return { data: null, error: error?.message ?? 'update_failed' }
  return { data: toTemplate(data as MessageTemplateRow), error: null }
}

export async function deleteMessageTemplate(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('message_templates').delete().eq('id', id)
  return { error: error?.message ?? null }
}
