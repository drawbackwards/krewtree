/**
 * Generate the Supabase Auth email templates as static HTML.
 *
 * Supabase sends auth emails (confirm signup, reset password) itself, using the
 * HTML pasted into its dashboard template editor, and substitutes its own
 * template variables at send time. So we render our react-email components to
 * static HTML here, injecting Supabase's `{{ .ConfirmationURL }}` / `{{ .Email }}`
 * placeholders, and write the result into supabase/templates/ for pasting.
 *
 * Sentinels (no braces/spaces) are passed as the dynamic props and swapped for
 * the real Supabase placeholders after render, so react-email's href handling
 * can't mangle the `{{ }}` tokens.
 *
 * Run: npm run build:auth-emails
 */
import { render } from '@react-email/render'
import { createElement } from 'react'
import { mkdirSync, writeFileSync } from 'node:fs'
import { VerifyEmail } from '../api/_email/templates/VerifyEmail.tsx'
import { ResetPasswordEmail } from '../api/_email/templates/ResetPasswordEmail.tsx'

const CONFIRMATION_URL = '__CONFIRMATION_URL__'
const EMAIL = '__EMAIL__'

const outDir = new URL('../supabase/templates/', import.meta.url)
mkdirSync(outDir, { recursive: true })

const targets = [
  {
    file: 'confirm-signup.html',
    element: createElement(VerifyEmail, { email: EMAIL, verifyUrl: CONFIRMATION_URL }),
  },
  {
    file: 'reset-password.html',
    element: createElement(ResetPasswordEmail, { resetUrl: CONFIRMATION_URL }),
  },
]

for (const { file, element } of targets) {
  let html = await render(element)
  html = html.replaceAll(CONFIRMATION_URL, '{{ .ConfirmationURL }}').replaceAll(EMAIL, '{{ .Email }}')
  writeFileSync(new URL(file, outDir), html)
  // eslint-disable-next-line no-console
  console.log(`wrote supabase/templates/${file} (${html.length} bytes)`)
}
