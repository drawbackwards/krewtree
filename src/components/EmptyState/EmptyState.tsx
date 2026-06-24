import React from 'react'
import styles from './EmptyState.module.css'

export interface EmptyStateProps {
  /** Message describing the empty state. */
  message: React.ReactNode
  /** Optional CTA(s) rendered beneath the message (typically a Button). */
  action?: React.ReactNode
  className?: string
}

/**
 * Go-to empty-state pattern: a soft dashed box with centered explanatory
 * text and an optional CTA underneath. Use anywhere a list/section has
 * nothing to show yet.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ message, action, className }) => (
  <div className={[styles.root, className ?? ''].filter(Boolean).join(' ')}>
    <p className={styles.message}>{message}</p>
    {action}
  </div>
)
