/**
 * Krewtree digest email template
 *
 * Two-level structure: category → optional subgroups → items.
 *   - Category corresponds to the notification setting section (Applicants,
 *     Messages, Jobs, Pipeline, etc.).
 *   - Subgroups are used when items naturally cluster by another dimension.
 *     For the Applicants digest, subgroups are job titles: each job title
 *     heads a list of applicant events for that job.
 *   - Items are the individual events.
 *
 * A DigestGroup may carry either `items` (flat) or `subGroups` (nested).
 * If both are provided, subGroups render and items are ignored.
 */

import * as React from 'react'
import { Hr, Link, Section, Text } from '@react-email/components'
import { EmailButton, EmailHeading, EmailLayout, EmailText } from './EmailLayout'
import { COLORS, type NotificationCategory } from './emailConstants'

export interface DigestItem {
  title: string
  subtitle?: string
  timestamp?: string
  href?: string
}

export interface DigestSubGroup {
  /** Heading for this subgroup, e.g. a job title. */
  title: string
  /** Optional link on the subgroup header, e.g. link to the job posting. */
  href?: string
  /** Optional right-side meta, e.g. "3 open positions". */
  meta?: string
  items: DigestItem[]
}

export interface DigestGroup {
  category: NotificationCategory
  /** Flat list of items. Ignored if subGroups is provided. */
  items?: DigestItem[]
  /** Nested subgroups. Renders instead of items when present. */
  subGroups?: DigestSubGroup[]
}

export interface DigestEmailProps {
  preheader: string
  heading: string
  introText?: string
  groups: DigestGroup[]
  ctaLabel?: string
  ctaUrl?: string
  /** Category that owns this digest (drives preferences deep link). */
  category: NotificationCategory
  unsubscribeUrl?: string
}

export function DigestEmail(props: DigestEmailProps) {
  const { preheader, heading, introText, groups, ctaLabel, ctaUrl, category, unsubscribeUrl } =
    props

  return (
    <EmailLayout preheader={preheader} category={category} unsubscribeUrl={unsubscribeUrl}>
      <EmailHeading>{heading}</EmailHeading>

      {introText && <EmailText>{introText}</EmailText>}

      {groups.map((group, idx) => {
        const isSubGrouped = !!group.subGroups && group.subGroups.length > 0

        return (
          <Section key={`group-${group.category}-${idx}`} style={{ margin: '4px 0 4px 0' }}>
            {isSubGrouped
              ? group.subGroups!.map((sg, sgIdx) => (
                  <Section key={`sg-${group.category}-${idx}-${sgIdx}`} style={subGroupStyle}>
                    <SubGroupHeader title={sg.title} href={sg.href} meta={sg.meta} />
                    {sg.items.map((item, i) => (
                      <ItemRow key={`sg-${idx}-${sgIdx}-${i}`} item={item} />
                    ))}
                  </Section>
                ))
              : (group.items ?? []).map((item, i) => (
                  <ItemRow key={`${group.category}-${idx}-${i}`} item={item} />
                ))}

            {idx < groups.length - 1 && <Hr style={hrStyle} />}
          </Section>
        )
      })}

      {ctaLabel && ctaUrl && (
        <Section style={{ padding: '20px 0 8px 0' }}>
          <EmailButton href={ctaUrl}>{ctaLabel}</EmailButton>
        </Section>
      )}
    </EmailLayout>
  )
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function SubGroupHeader({ title, href, meta }: { title: string; href?: string; meta?: string }) {
  return (
    <Section style={subGroupHeaderStyle}>
      <Text style={subGroupTitleStyle}>
        {href ? (
          <Link href={href} style={subGroupLinkStyle}>
            {title}
          </Link>
        ) : (
          title
        )}
      </Text>
      {meta && <Text style={subGroupMetaStyle}>{meta}</Text>}
    </Section>
  )
}

function ItemRow({ item }: { item: DigestItem }) {
  return (
    <Section style={itemRowStyle}>
      <Text style={itemTitleStyle}>
        {item.href ? (
          <Link href={item.href} style={itemLinkStyle}>
            {item.title}
          </Link>
        ) : (
          item.title
        )}
      </Text>
      {(item.subtitle || item.timestamp) && (
        <Text style={itemMetaStyle}>
          {[item.subtitle, item.timestamp].filter(Boolean).join(' · ')}
        </Text>
      )}
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const subGroupStyle: React.CSSProperties = {
  margin: '0 0 20px 0',
}

const subGroupHeaderStyle: React.CSSProperties = {
  padding: '0 0 6px 0',
  borderBottom: `1px solid ${COLORS.border}`,
  margin: '0 0 4px 0',
}

const subGroupTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '22px',
  fontWeight: 600,
  color: COLORS.bodyText,
  margin: '0',
  display: 'inline-block',
}

const subGroupLinkStyle: React.CSSProperties = {
  color: COLORS.bodyText,
  textDecoration: 'none',
}

const subGroupMetaStyle: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '18px',
  color: COLORS.mutedText,
  margin: '2px 0 0 0',
}

const itemRowStyle: React.CSSProperties = {
  padding: '10px 0',
  borderBottom: `1px solid ${COLORS.border}`,
}

const itemTitleStyle: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '22px',
  color: COLORS.bodyText,
  margin: '0 0 2px 0',
}

const itemLinkStyle: React.CSSProperties = {
  color: COLORS.bodyText,
  textDecoration: 'none',
}

const itemMetaStyle: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '18px',
  color: COLORS.mutedText,
  margin: '0',
}

const hrStyle: React.CSSProperties = {
  border: 'none',
  borderTop: `1px solid ${COLORS.border}`,
  margin: '20px 0 4px 0',
}
