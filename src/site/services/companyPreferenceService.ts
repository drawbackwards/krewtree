import { supabase } from '@/lib/supabase'

export type ApplicantsView = 'list' | 'kanban'

export async function getApplicantsView(
  companyId: string
): Promise<{ data: ApplicantsView | null; error: unknown }> {
  const { data, error } = await supabase
    .from('company_profiles')
    .select('applicants_view')
    .eq('id', companyId)
    .single()

  if (error) return { data: null, error }
  return { data: ((data as unknown as Record<string, unknown>).applicants_view as ApplicantsView) ?? 'list', error: null }
}

export async function setApplicantsView(
  companyId: string,
  view: ApplicantsView
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('company_profiles')
    .update({ applicants_view: view } as Record<string, unknown>)
    .eq('id', companyId)

  return { error }
}
