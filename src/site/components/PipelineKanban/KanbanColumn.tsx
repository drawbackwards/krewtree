import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { CompanyApplicant, KanbanStage } from '../../types'
import { ChevronDownIcon, ChevronUpIcon } from '../../icons'
import { KanbanCard } from './KanbanCard'
import styles from './PipelineKanban.module.css'

const MAX_VISIBLE = 20

type Props = {
  stage: KanbanStage
  label: string
  applicants: CompanyApplicant[]
  isValidDrop?: boolean
  collapsedOnMobile: boolean
  onToggleCollapse: () => void
  onCardClick: (applicant: CompanyApplicant) => void
  onReject: (applicant: CompanyApplicant) => void
  onHire: (applicant: CompanyApplicant) => void
  onMessage?: (applicant: CompanyApplicant) => void
}

export const KanbanColumn: React.FC<Props> = ({
  stage,
  label,
  applicants,
  isValidDrop,
  collapsedOnMobile,
  onToggleCollapse,
  onCardClick,
  onReject,
  onHire,
  onMessage,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  let columnClass = styles.column
  if (isOver && isValidDrop !== false) columnClass += ` ${styles.columnValidDrop}`
  if (isOver && isValidDrop === false) columnClass += ` ${styles.columnInvalidDrop}`

  const visible = applicants.slice(0, MAX_VISIBLE)

  return (
    <div className={styles.columnWrapper}>
      {/* Column header — clickable for mobile collapse */}
      <div className={styles.columnHeader}>
        <button
          type="button"
          className={styles.columnHeaderBtn}
          onClick={onToggleCollapse}
          aria-expanded={!collapsedOnMobile}
          aria-controls={`kanban-col-${stage}`}
        >
          <span className={styles.columnLabel}>{label}</span>
          <span className={styles.columnCount}>({applicants.length})</span>
          <span className={styles.collapseIcon}>
            {collapsedOnMobile ? <ChevronDownIcon size={13} /> : <ChevronUpIcon size={13} />}
          </span>
        </button>
      </div>

      {/* Column body */}
      <div
        id={`kanban-col-${stage}`}
        ref={setNodeRef}
        data-stage={stage}
        className={[columnClass, collapsedOnMobile ? styles.columnCollapsed : '']
          .filter(Boolean)
          .join(' ')}
      >
        <div className={styles.cardList}>
          {visible.map((a) => (
            <KanbanCard
              key={a.id}
              applicant={a}
              onCardClick={onCardClick}
              onReject={onReject}
              onHire={onHire}
              onMessage={onMessage}
            />
          ))}
          {applicants.length === 0 && <div className={styles.emptyColumn} />}
        </div>
      </div>
    </div>
  )
}
