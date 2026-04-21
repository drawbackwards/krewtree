import React from 'react'
import type { KanbanStage } from '../../types'
import styles from './StagePill.module.css'

const LABELS: Record<KanbanStage, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
}

export interface StagePillProps {
  stage: KanbanStage
  size?: 'sm' | 'md'
}

export const StagePill: React.FC<StagePillProps> = ({ stage, size = 'md' }) => {
  return (
    <span className={[styles.pill, styles[stage], styles[size]].join(' ')}>{LABELS[stage]}</span>
  )
}
