// ============================================================
// Vercel serverless function — deliver a team invite by email via Resend.
//
// Why this lives server-side:
//   • The Resend API key must never reach the browser bundle (it is NOT a
//     VITE_-prefixed var, so it is only readable here at runtime).
//   • The endpoint is authenticated — a valid krewtree session is required — so
//     it can't be abused as an open email relay.
//   • The join link is rebuilt here from a trusted origin + the token, so a
//     caller cannot inject an arbitrary (phishing) URL into an email that ships
//     from our domain.
//
// The email body is the shared react-email template system in ./_email
// (InviteEmail → EmailLayout). The invite row itself is still created
// client-side (RLS-enforced) in teamService.createInvite(); this function only
// sends the resulting link. Until the sending domain (mail.krewtree.com) is
// verified in Resend, delivery is limited to the Resend account's own address
// and every other recipient 403s — the Team UI keeps showing the copyable link
// as the fallback. See docs/EMAIL_SETUP.md.
// ============================================================
import * as React from 'react'
import { createClient } from '@supabase/supabase-js'
import { InviteEmail } from './_email/templates/InviteEmail.js'
import { sendKrewtreeEmail } from './_email/sendEmail.js'

// Minimal structural types for the Vercel Node request/response — avoids a
// dependency on @vercel/node just for two interfaces.
interface RequestLike {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body: unknown
}
interface ResponseLike {
  status(code: number): ResponseLike
  json(body: unknown): void
}

interface InviteBody {
  email: string
  token: string
  companyName?: string
  inviterName?: string
  role?: 'admin' | 'member'
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function parseBody(raw: unknown): InviteBody | null {
  let obj: unknown = raw
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw)
    } catch {
      return null
    }
  }
  if (!obj || typeof obj !== 'object') return null
  const b = obj as Record<string, unknown>
  if (typeof b.email !== 'string' || typeof b.token !== 'string') return null
  return {
    email: b.email.trim(),
    token: b.token,
    companyName: typeof b.companyName === 'string' ? b.companyName.trim() : undefined,
    inviterName: typeof b.inviterName === 'string' ? b.inviterName.trim() : undefined,
    role: b.role === 'admin' || b.role === 'member' ? b.role : undefined,
  }
}

/** The app origin used to build the join link — trusted, never client-supplied. */
function siteOrigin(req: RequestLike): string {
  const configured = process.env.PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/+$/, '')
  const host = firstHeader(req.headers['x-forwarded-host']) ?? firstHeader(req.headers.host)
  const proto = firstHeader(req.headers['x-forwarded-proto']) ?? 'https'
  return host ? `${proto}://${host}` : 'https://krewtree-app.vercel.app'
}

export default async function handler(req: RequestLike, res: ResponseLike): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  const resendKey = process.env.RESEND_API_KEY
  if (!supabaseUrl || !anonKey) {
    res.status(500).json({ error: 'supabase_not_configured' })
    return
  }
  if (!resendKey) {
    res.status(500).json({ error: 'email_not_configured' })
    return
  }

  // AuthN — require a real krewtree session so this is not an open relay.
  const bearer = firstHeader(req.headers.authorization)
  const jwt = bearer?.startsWith('Bearer ') ? bearer.slice(7) : undefined
  if (!jwt) {
    res.status(401).json({ error: 'unauthenticated' })
    return
  }
  const supabase = createClient(supabaseUrl, anonKey)
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt)
  if (userErr || !userData?.user) {
    res.status(401).json({ error: 'unauthenticated' })
    return
  }

  const body = parseBody(req.body)
  if (!body || !EMAIL_RE.test(body.email) || !body.token) {
    res.status(400).json({ error: 'invalid_request' })
    return
  }

  const joinUrl = `${siteOrigin(req)}/join?token=${encodeURIComponent(body.token)}`
  const company = body.companyName || 'a company'
  const subject = `You're invited to join ${company} on Krewtree`

  try {
    const result = await sendKrewtreeEmail({
      to: body.email,
      subject,
      react: React.createElement(InviteEmail, {
        companyName: company,
        inviterName: body.inviterName,
        role: body.role,
        joinUrl,
      }),
      // Dedupe retries of the same invite (token is unique per invite).
      idempotencyKey: `invite:${body.token.slice(0, 200)}`,
    })
    if (result.error) {
      res.status(502).json({ error: 'send_failed', detail: result.error.message })
      return
    }
    res.status(200).json({ id: result.data?.id ?? null })
  } catch (err) {
    res.status(502).json({
      error: 'send_failed',
      detail: err instanceof Error ? err.message : 'unknown',
    })
  }
}
