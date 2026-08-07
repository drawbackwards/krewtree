/**
 * Krewtree email constants
 *
 * All placeholder values are marked with TODO. Replace before production send.
 * Legal entity name and physical address are required content for CAN-SPAM
 * compliance when an email's primary purpose is commercial (16 CFR 316.3(a)).
 * Even for transactional/relationship messages, including them is recommended
 * as an insurance policy against accidental mixed-content classification
 * (16 CFR 316.3(a)(2)) and for deliverability.
 */

export const COLORS = {
  headerBg: '#0A232D', // dark teal, used for the header band
  buttonBg: '#6D7531', // brand olive, used for primary CTA
  footerBg: '#F6F2E8', // warm sandy, used inside the frame for the footer band
  canvasBg: '#FFFFFF', // white, used behind the email frame
  cardBg: '#FFFFFF', // content card
  bodyText: '#1C3D4A', // body copy and headings (mid teal)
  mutedText: '#6B7280', // secondary text, footer
  border: '#E5E7EB', // dividers and card borders
  buttonText: '#FFFFFF', // text on primary button
  headerText: '#FFFFFF', // text on header band
  secondaryCardBg: '#F9FAFB', // detail card inside body
} as const

export const FONTS = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
} as const

// `fromEmail` is the verified sending address (mail.krewtree.com is verified in
// Resend as of 2026-08-07). sendEmail.ts still lets EMAIL_FROM override it, but
// the default must be on the verified domain so sends work even without the env
// var. reply-to / unsubscribe mailboxes on the root domain are header-only and
// don't need Resend verification (they just need a real inbox to receive).
export const SENDER = {
  fromName: 'Krewtree',
  fromEmail: 'noreply@mail.krewtree.com',
  replyTo: 'support@krewtree.com',
  unsubscribeMailto: 'unsubscribe@krewtree.com',
} as const

// TODO: replace with registered legal entity name and a valid physical postal
// address per 15 USC 7704(a)(5)(A)(iii). 16 CFR 316.2(p) permits a USPS-
// registered PO Box or a CMRA private mailbox in addition to a street address.
export const LEGAL = {
  entityName: 'Krewtree',
  addressLine1: '[Street Address Placeholder]',
  addressLine2: '[City, State ZIP Placeholder]',
} as const

// TODO: replace baseUrl, privacyUrl, and termsUrl with production values.
export const URLS = {
  baseUrl: 'https://krewtree.com',
  logoUrl:
    'https://ryigaxihlfqdwgjbgmcg.supabase.co/storage/v1/object/public/avatars/brand/krewtree-logo-horizontal-white.png',
  privacyUrl: 'https://krewtree.com/privacy',
  termsUrl: 'https://krewtree.com/terms',
} as const

export type NotificationCategory =
  | 'applicants'
  | 'messages'
  | 'jobs'
  | 'pipeline'
  | 'account'
  | 'regulix'
  | 'security'

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  applicants: 'Applicants',
  messages: 'Messages',
  jobs: 'Jobs',
  pipeline: 'Pipeline',
  account: 'Account',
  regulix: 'Regulix',
  security: 'Security',
}

export function preferencesUrl(category: NotificationCategory): string {
  if (category === 'security') return `${URLS.baseUrl}/settings/notifications`
  return `${URLS.baseUrl}/settings/notifications#${category}`
}

export function unsubscribeUrl(token: string): string {
  return `${URLS.baseUrl}/unsubscribe?token=${encodeURIComponent(token)}`
}
