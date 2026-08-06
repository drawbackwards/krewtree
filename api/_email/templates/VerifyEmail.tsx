/**
 * Verify email address. Sent on signup and on email change.
 *
 * NOTE: this is a Supabase Auth email. When wired into Supabase (Custom SMTP +
 * the "Confirm signup" template), render this to static HTML and pass Supabase's
 * `{{ .ConfirmationURL }}` template variable as `verifyUrl` so Supabase
 * substitutes the real link at send time. See docs/EMAIL_SETUP.md.
 */

import { TransactionalEmail } from '../TransactionalEmail'

export const verifyEmailSubject = 'Verify your email to finish setting up Krewtree'

export interface VerifyEmailProps {
  /** The address being confirmed. */
  email: string
  /** Confirmation link (or Supabase's {{ .ConfirmationURL }} placeholder). */
  verifyUrl: string
}

export function VerifyEmail({ email, verifyUrl }: VerifyEmailProps) {
  return (
    <TransactionalEmail
      preheader="Confirm your email to finish setting up your Krewtree account."
      heading="Verify your email"
      bodyText={`Confirm that ${email} belongs to you to finish setting up your Krewtree account and unlock the full experience: posting or applying to jobs, messaging, and managing your work.`}
      ctaLabel="Verify email"
      ctaUrl={verifyUrl}
      signOff="If you didn't create a Krewtree account, you can safely ignore this email."
      category="account"
      footer="transactional"
    />
  )
}
