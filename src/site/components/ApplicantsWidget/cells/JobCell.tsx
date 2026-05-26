import React from 'react'
import { Link } from 'react-router-dom'
import { Tooltip } from '../../../../components'
import { PauseIcon } from '../../../icons'
import type { Job } from '../../../types'
import styles from './JobCell.module.css'

interface Props {
  jobId: string
  jobTitle: string
  jobStatus: Job['status']
}

export const JobCell: React.FC<Props> = ({ jobId, jobTitle, jobStatus }) => (
  <div className={styles.cell}>
    <Link to={`/site/jobs/${jobId}`} className={styles.link}>
      {jobTitle}
    </Link>
    {jobStatus === 'paused' && (
      <Tooltip content="Job is paused — no new applicants" position="top">
        <span className={styles.pauseIcon} aria-label="Job paused">
          <PauseIcon size={9} />
        </span>
      </Tooltip>
    )}
  </div>
)
