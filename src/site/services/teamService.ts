// ============================================================
// Team / seat management for company accounts.
//
// A company is an organization (company_profiles.id) with many member seats
// (company_members). Owners/admins manage seats and send email invites; the
// invitee accepts a tokenized link, which turns the pending invite into a
// membership (see accept_company_invite). All authorization is enforced by RLS
// and the SECURITY DEFINER RPCs — this layer is a thin, typed wrapper.
// ============================================================
import { supabase } from '../../lib/supabase'

export type CompanyRole = 'owner' | 'admin' | 'member'

/** Assignable (non-owner) roles, for role <select> menus. */
export const roleOptions: { label: string; value: 'admin' | 'member' }[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Member', value: 'member' },
]

export interface TeamMember {
  userId: string
  role: CompanyRole
  email: string
  firstName: string
  lastName: string
  /** Best-effort display label: full name, else the email local part. */
  displayName: string
  createdAt: string
}

export interface PendingInvite {
  id: string
  email: string
  role: Exclude<CompanyRole, 'owner'>
  createdAt: string
  expiresAt: string
}

function memberDisplayName(email: string, first: string, last: string): string {
  const full = `${first} ${last}`.trim()
  if (full) return full
  return email.split('@')[0] ?? email
}

export async function listMembers(
  companyId: string
): Promise<{ data: TeamMember[]; error: string | null }> {
  const { data, error } = await supabase.rpc('get_company_members', { p_company_id: companyId })
  if (error) return { data: [], error: error.message }
  const members = (data ?? []).map((r) => ({
    userId: r.user_id,
    role: r.role as CompanyRole,
    email: r.email,
    firstName: r.first_name,
    lastName: r.last_name,
    displayName: memberDisplayName(r.email, r.first_name, r.last_name),
    createdAt: r.created_at,
  }))
  return { data: members, error: null }
}

export async function listPendingInvites(
  companyId: string
): Promise<{ data: PendingInvite[]; error: string | null }> {
  const { data, error } = await supabase
    .from('company_invites')
    .select('id, email, role, created_at, expires_at')
    .eq('company_id', companyId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) return { data: [], error: error.message }
  const invites = (data ?? []).map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role as Exclude<CompanyRole, 'owner'>,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
  }))
  return { data: invites, error: null }
}

/**
 * Deliver an invite link to the invitee by email.
 *
 * TODO(email): NOT IMPLEMENTED. krewtree has no transactional email provider
 * wired yet (see PROJECT_LOG pre-launch checklist). When one is added, send the
 * invite email from here (ideally server-side — a Vercel function or Supabase
 * Edge Function invoked by create_company_invite so the token never round-trips
 * through the browser). Until then this is a no-op and createInvite() also
 * returns the link so an admin can share it manually as a fallback.
 */
export async function sendInviteEmail(_email: string, _link: string): Promise<void> {
  // Intentionally a no-op until email delivery is set up.
  return
}

/**
 * Create an invite. The intended UX is that the invitee receives the link by
 * email (see sendInviteEmail). Email delivery is not built yet, so the raw token
 * link is also returned for manual sharing — it is returned only here (the DB
 * stores just its hash) and cannot be recovered later.
 */
export async function createInvite(
  companyId: string,
  email: string,
  role: Exclude<CompanyRole, 'owner'>
): Promise<{ data: { inviteId: string; link: string } | null; error: string | null }> {
  const { data, error } = await supabase.rpc('create_company_invite', {
    p_company_id: companyId,
    p_email: email,
    p_role: role,
  })
  if (error) return { data: null, error: mapError(error.message) }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return { data: null, error: 'invite_failed' }
  const link = `${window.location.origin}/site/join?token=${row.token}`
  // Fire the (currently no-op) email delivery; the manual link is the fallback.
  await sendInviteEmail(email, link)
  return { data: { inviteId: row.invite_id, link }, error: null }
}

export async function revokeInvite(inviteId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('company_invites')
    .update({ status: 'revoked' })
    .eq('id', inviteId)
  return { error: error?.message ?? null }
}

export async function acceptInvite(
  token: string
): Promise<{ data: { companyId: string } | null; error: string | null }> {
  const { data, error } = await supabase.rpc('accept_company_invite', { p_token: token })
  if (error) return { data: null, error: mapError(error.message) }
  return { data: { companyId: data as string }, error: null }
}

/**
 * Look up the email a pending invite was addressed to, so the join page can
 * prefill and lock it. Returns null for an invalid/expired token (and on error).
 * The token is the secret; a holder is entitled to see the invited email.
 */
export async function getInviteEmail(
  token: string
): Promise<{ data: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('get_invite_email', { p_token: token })
  if (error) return { data: null, error: mapError(error.message) }
  return { data: (data as string | null) ?? null, error: null }
}

export async function changeMemberRole(
  companyId: string,
  userId: string,
  role: Exclude<CompanyRole, 'owner'>
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('company_members')
    .update({ role })
    .eq('company_id', companyId)
    .eq('user_id', userId)
  return { error: error?.message ?? null }
}

export async function removeMember(
  companyId: string,
  userId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('company_members')
    .delete()
    .eq('company_id', companyId)
    .eq('user_id', userId)
  return { error: error?.message ?? null }
}

export async function transferOwnership(
  companyId: string,
  newOwnerUserId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('transfer_company_ownership', {
    p_company_id: companyId,
    p_new_owner: newOwnerUserId,
  })
  return { error: error ? mapError(error.message) : null }
}

// Turn raw RAISE messages / postgres errors into friendly copy.
function mapError(msg: string): string {
  if (msg.includes('seat_cap_reached')) return 'This company has reached its seat limit.'
  if (msg.includes('invalid_or_expired')) return 'This invite link is invalid or has expired.'
  if (msg.includes('email_mismatch'))
    return 'This invite was sent to a different email address. Sign in with the invited email to accept.'
  if (msg.includes('not_authorized') || msg.includes('insufficient_privilege'))
    return 'You do not have permission to do that.'
  if (msg.includes('invalid_role')) return 'Invalid role.'
  if (msg.includes('invalid_email')) return 'Enter a valid email address.'
  if (msg.includes('one_pending_invite_per_email') || msg.includes('duplicate key'))
    return 'There is already a pending invite for that email.'
  return msg
}
