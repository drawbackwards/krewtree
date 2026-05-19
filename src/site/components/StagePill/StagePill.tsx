import React from 'react'
import type { ApplicationStatus } from '../../types'
import styles from './StagePill.module.css'

export interface StagePillProps {
  label: string
  status?: ApplicationStatus
  size?: 'sm' | 'md'
}

export const StagePill: React.FC<StagePillProps> = ({ label, status, size = 'md' }) => {
  const variant = !status || status === 'active' ? 'active' : status
  return <span className={[styles.pill, styles[variant], styles[size]].join(' ')}>{label}</span>
}
