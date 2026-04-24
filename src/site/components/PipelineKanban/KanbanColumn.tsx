import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { CompanyApplicant, KanbanStage } from '../../types'
import { KanbanCard } from './KanbanCard'
import styles from './PipelineKanban.module.css'

type Props = {
  stage: KanbanStage
  label: string
  applicants: CompanyApplicant[]
}

export const KanbanColumn: React.FC<Props> = ({ stage, label, applicants }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const className = isOver ? `${styles.column} ${styles.columnOver}` : styles.column

  return (
    <div ref={setNodeRef} className={className} data-stage={stage}>
      <div className={styles.columnHeader}>
        <span className={styles.columnLabel}>{label}</span>
        <span className={styles.count}>{applicants.length}</span>
      </div>
      <div className={styles.cardList}>
        {applicants.map((a) => (
          <KanbanCard key={a.id} applicant={a} />
        ))}
        {applicants.length === 0 && <div className={styles.empty}>Drop here</div>}
      </div>
    </div>
  )
}
