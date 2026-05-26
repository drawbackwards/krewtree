import React from 'react'
import type { ApplicationStatus } from '../../../types'
import { StagePill } from '../../StagePill/StagePill'
import styles from './StageCell.module.css'

interface Props {
  stageName: string
  status: ApplicationStatus
}

export const StageCell: React.FC<Props> = ({ stageName, status }) => (
  <div className={styles.cell}>
    <StagePill label={stageName} status={status} size="sm" />
  </div>
)
