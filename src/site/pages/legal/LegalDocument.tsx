import React from 'react'

/**
 * Shared chrome for the legal document pages (Terms, Privacy). Presentational
 * only — it renders a readable single-column layout with a title, a
 * "last updated" line, and a clearly-marked PLACEHOLDER notice. The section
 * skeletons the pages pass as children are structure to drop final,
 * counsel-reviewed copy into before launch.
 */
export interface LegalDocumentProps {
  title: string
  /** Human-readable date the copy was last revised, e.g. "Not yet published". */
  lastUpdated: string
  children: React.ReactNode
}

export const LegalDocument: React.FC<LegalDocumentProps> = ({ title, lastUpdated, children }) => (
  <div
    style={{
      maxWidth: 760,
      margin: '0 auto',
      padding: 'var(--kt-space-6) var(--kt-space-4) var(--kt-space-8)',
      color: 'var(--kt-text)',
      fontFamily: 'var(--kt-font-sans)',
    }}
  >
    <h1 style={{ fontSize: 'var(--kt-text-2xl)', fontWeight: 'var(--kt-weight-bold)', margin: 0 }}>
      {title}
    </h1>
    <p
      style={{
        margin: '6px 0 0',
        fontSize: 'var(--kt-text-sm)',
        color: 'var(--kt-text-muted)',
      }}
    >
      Last updated: {lastUpdated}
    </p>

    {/* PLACEHOLDER banner — remove once final copy lands. */}
    <div
      role="note"
      style={{
        margin: 'var(--kt-space-5) 0',
        padding: 'var(--kt-space-3) var(--kt-space-4)',
        background: 'var(--kt-warning-subtle, var(--kt-surface-alt))',
        border: '1px solid var(--kt-border)',
        borderRadius: 'var(--kt-radius-md)',
        fontSize: 'var(--kt-text-sm)',
      }}
    >
      <strong>Placeholder document.</strong> This is a structural draft, not the final agreement.
      Counsel-reviewed copy will replace the sections below before krewtree opens to users.
    </div>

    {children}
  </div>
)

/** A titled section within a legal document. */
export const LegalSection: React.FC<{ heading: string; children: React.ReactNode }> = ({
  heading,
  children,
}) => (
  <section style={{ marginTop: 'var(--kt-space-5)' }}>
    <h2
      style={{
        fontSize: 'var(--kt-text-lg)',
        fontWeight: 'var(--kt-weight-bold)',
        margin: '0 0 6px',
      }}
    >
      {heading}
    </h2>
    <div
      style={{ fontSize: 'var(--kt-text-base)', lineHeight: 1.6, color: 'var(--kt-text-muted)' }}
    >
      {children}
    </div>
  </section>
)
