/**
 * Reset password. Supabase Auth "Reset Password" (recovery) email.
 *
 * When wired into Supabase (Custom SMTP + the "Reset Password" template), render
 * this to static HTML and pass Supabase's `{{ .ConfirmationURL }}` as `resetUrl`
 * so Supabase substitutes the real recovery link at send time. Non-optoutable,
 * so it uses the transactional footer (no preferences link). See docs/EMAIL_SETUP.md.
 */

import { TransactionalEmail } from '../TransactionalEmail.js'

export const resetPasswordSubject = 'Reset your Krewtree password'

export interface ResetPasswordEmailProps {
  /** Recovery link (or Supabase's {{ .ConfirmationURL }} placeholder). */
  resetUrl: string
}

export function ResetPasswordEmail({ resetUrl }: ResetPasswordEmailProps) {
  return (
    <TransactionalEmail
      preheader="Use the secure link inside to choose a new password. It expires soon."
      heading="Reset your password"
      bodyText="We received a request to reset the password for your Krewtree account. Choose a new password using the button below. This link expires in one hour and can only be used once."
      ctaLabel="Reset password"
      ctaUrl={resetUrl}
      signOff="If you didn't request this, you can safely ignore this email and your password won't change."
      category="account"
      footer="transactional"
    />
  )
}
