import React from 'react'

/**
 * Shared headline + subtext for every Settings page, so all pages read
 * consistently (matching the Notifications page). Optional `action` renders on
 * the right of the headline row (e.g. "View public profile").
 */
export const SettingsPageHeader: React.FC<{
  title: string
  description: string
  action?: React.ReactNode
}> = ({ title, description, action }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
    }}
  >
    <div>
      <h1
        style={{
          fontSize: 'var(--kt-text-xl)',
          fontWeight: 'var(--kt-weight-bold)',
          color: 'var(--kt-text)',
          margin: '0 0 4px',
        }}
      >
        {title}
      </h1>
      <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
        {description}
      </p>
    </div>
    {action}
  </div>
)

export default SettingsPageHeader
