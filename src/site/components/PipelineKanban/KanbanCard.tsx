import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { CompanyApplicant } from '../../types'
import styles from './PipelineKanban.module.css'

type Props = {
  applicant: CompanyApplicant
}

export const KanbanCard: React.FC<Props> = ({ applicant }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: applicant.id,
  })

  const style: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {}

  const className = isDragging ? `${styles.card} ${styles.cardDragging}` : styles.card

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={className}
      {...listeners}
      {...attributes}
      aria-label={`${applicant.workerFullName}, ${applicant.jobTitle}`}
    >
      <div className={styles.avatar} aria-hidden="true">
        {applicant.workerInitials}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardName}>{applicant.workerFullName}</div>
        <div className={styles.cardJob}>{applicant.jobTitle}</div>
      </div>
    </div>
  )
}
