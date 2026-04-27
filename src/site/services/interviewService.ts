// interviews table is stubbed — types will be regenerated after migration is applied
export type InterviewEvent = {
  interview_id: string
  applicant_id: string
  job_id: string
  scheduled_at: string
  duration_minutes: number
  status: 'scheduled' | 'completed' | 'no_show' | 'cancelled'
  location_or_link: string | null
  applicant_name: string
  job_title: string
}

export async function getWeekInterviews(
  _companyId: string
): Promise<{ data: InterviewEvent[]; error: string | null }> {
  // Stub until interviews table is in Supabase-generated types
  return { data: [], error: null }
}
