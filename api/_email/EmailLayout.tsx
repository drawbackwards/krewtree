/**
 * Krewtree email shell
 *
 * Shared layout used by all email templates. Renders the dark-teal header,
 * white content card, and legal footer. Content templates (transactional,
 * digest, security) compose their body inside <EmailLayout>.
 *
 * Requires: react-email (@react-email/components)
 */

import * as React from 'react'
import {
  Body,
  Button as REButton,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import {
  CATEGORY_LABELS,
  COLORS,
  FONTS,
  LEGAL,
  URLS,
  preferencesUrl,
  type NotificationCategory,
} from './emailConstants'

export interface EmailLayoutProps {
  /** 40-100 chars. Extends the subject, does not repeat it. */
  preheader: string
  /** Drives the "Manage preferences" deep link. Use 'security' for password/sign-in/payment emails. */
  category: NotificationCategory
  /** Per-recipient unsubscribe URL. Omit for security notifications (which cannot be turned off). */
  unsubscribeUrl?: string
  /**
   * Footer treatment for the first line:
   *   'auto' (default) — security categories show the "cannot be turned off"
   *     line, everything else shows a "Manage <category> preferences" link.
   *   'transactional' — omit that line entirely. For non-optoutable action
   *     emails that aren't security alerts (invite, verify email, password
   *     reset), where a preferences link is misleading.
   */
  footer?: 'auto' | 'transactional'
  children: React.ReactNode
}

export function EmailLayout({
  preheader,
  category,
  unsubscribeUrl,
  footer = 'auto',
  children,
}: EmailLayoutProps) {
  const isSecurity = category === 'security'
  const isTransactional = footer === 'transactional'

  return (
    <Html>
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preheader}</Preview>
      <Body style={bodyStyle}>
        <Container style={outerContainer}>
          {/* Header: dark teal band with left-aligned logo (rounds top corners) */}
          <Section style={headerSection}>
            <Img src={URLS.logoUrl} alt="Krewtree" width="140" height="32" style={logoStyle} />
          </Section>

          {/* Body: white content area */}
          <Section style={bodySection}>{children}</Section>

          {/* Footer: sandy, inside the frame (rounds bottom corners) */}
          <Section style={footerSection}>
            {isTransactional ? null : isSecurity ? (
              <Text style={footerLine}>
                This is a security notification and cannot be turned off in your preferences.
              </Text>
            ) : (
              <Text style={footerLine}>
                <Link href={preferencesUrl(category)} style={footerLink}>
                  Manage {CATEGORY_LABELS[category]} notification preferences
                </Link>
              </Text>
            )}

            <Text style={footerLine}>
              You&rsquo;re receiving this because you have a Krewtree account.
            </Text>

            <Text style={footerAddress}>
              {LEGAL.entityName}
              <br />
              {LEGAL.addressLine1}
              <br />
              {LEGAL.addressLine2}
            </Text>

            <Text style={footerLegal}>
              <Link href={URLS.privacyUrl} style={footerLink}>
                Privacy
              </Link>
              {' · '}
              <Link href={URLS.termsUrl} style={footerLink}>
                Terms
              </Link>
              {unsubscribeUrl && (
                <>
                  {' · '}
                  <Link href={unsubscribeUrl} style={footerLink}>
                    Unsubscribe
                  </Link>
                </>
              )}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

/**
 * Primary CTA button. White text on brand olive (#6D7531).
 * Contrast ratio ~4.9:1 with white text, meets WCAG AA for normal text.
 */
export interface EmailButtonProps {
  href: string
  children: React.ReactNode
}

export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <REButton href={href} style={buttonStyle}>
      {children}
    </REButton>
  )
}

/** Body heading (H1) */
export function EmailHeading({ children }: { children: React.ReactNode }) {
  return <h1 style={headingStyle}>{children}</h1>
}

/** Body paragraph */
export function EmailText({ children }: { children: React.ReactNode }) {
  return <p style={textStyle}>{children}</p>
}

/** Secondary detail card (used inside transactional emails for context blocks) */
export function EmailSecondaryCard({ children }: { children: React.ReactNode }) {
  return <Section style={secondaryCardStyle}>{children}</Section>
}

// ---------------------------------------------------------------------------
// Styles (email clients strip external CSS; everything is inlined here)
// ---------------------------------------------------------------------------

const bodyStyle: React.CSSProperties = {
  backgroundColor: COLORS.canvasBg,
  fontFamily: FONTS.sans,
  margin: 0,
  padding: 0,
  WebkitFontSmoothing: 'antialiased',
}

const outerContainer: React.CSSProperties = {
  maxWidth: '600px',
  width: '100%',
  margin: '0 auto',
  padding: '0 0 24px 0',
}

/**
 * The email frame is composed from three stacked Sections. Borders and
 * corner radii are applied to each region rather than to a wrapping
 * container with overflow:hidden, since overflow:hidden is not reliably
 * supported across email clients.
 */
const headerSection: React.CSSProperties = {
  backgroundColor: COLORS.headerBg,
  padding: '20px 32px',
  borderTopLeftRadius: '8px',
  borderTopRightRadius: '8px',
  borderTop: `1px solid ${COLORS.border}`,
  borderLeft: `1px solid ${COLORS.border}`,
  borderRight: `1px solid ${COLORS.border}`,
}

const logoStyle: React.CSSProperties = {
  display: 'block',
}

const bodySection: React.CSSProperties = {
  backgroundColor: COLORS.cardBg,
  padding: '32px',
  borderLeft: `1px solid ${COLORS.border}`,
  borderRight: `1px solid ${COLORS.border}`,
}

const footerSection: React.CSSProperties = {
  backgroundColor: COLORS.footerBg,
  padding: '24px 32px',
  textAlign: 'left' as const,
  borderTop: `1px solid ${COLORS.border}`,
  borderLeft: `1px solid ${COLORS.border}`,
  borderRight: `1px solid ${COLORS.border}`,
  borderBottom: `1px solid ${COLORS.border}`,
  borderBottomLeftRadius: '8px',
  borderBottomRightRadius: '8px',
}

const footerLine: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '20px',
  color: COLORS.mutedText,
  margin: '0 0 8px 0',
}

const footerLink: React.CSSProperties = {
  color: COLORS.mutedText,
  textDecoration: 'underline',
}

const footerAddress: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '18px',
  color: COLORS.mutedText,
  margin: '16px 0 12px 0',
}

const footerLegal: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '18px',
  color: COLORS.mutedText,
  margin: '0',
}

const headingStyle: React.CSSProperties = {
  fontSize: '22px',
  lineHeight: '30px',
  fontWeight: 600,
  color: COLORS.bodyText,
  margin: '0 0 16px 0',
}

const textStyle: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '24px',
  color: COLORS.bodyText,
  margin: '0 0 16px 0',
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: COLORS.buttonBg,
  color: COLORS.buttonText,
  padding: '12px 24px',
  borderRadius: '6px',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
  lineHeight: '20px',
}

const secondaryCardStyle: React.CSSProperties = {
  backgroundColor: COLORS.secondaryCardBg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '6px',
  padding: '16px 20px',
  margin: '8px 0 20px 0',
}
