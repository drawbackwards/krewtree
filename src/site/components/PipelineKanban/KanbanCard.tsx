import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useDraggable } from '@dnd-kit/core'
import type { CompanyApplicant } from '../../types'
import {
  DotsHorizontalIcon,
  WarningTriangleIcon,
  DangerCircleIcon,
  FlagIcon,
  CloseIcon,
  CheckIcon,
  PersonIcon,
  MessageIcon,
  RegulixMarkIcon,
} from '../../icons'
import styles from './PipelineKanban.module.css'

type Props = {
  applicant: CompanyApplicant
  onCardClick: (applicant: CompanyApplicant) => void
  onReject: (applicant: CompanyApplicant) => void
  onHire: (applicant: CompanyApplicant) => void
  onMessage?: (applicant: CompanyApplicant) => void
}

export const KanbanCard: React.FC<Props> = ({
  applicant,
  onCardClick,
  onReject,
  onHire,
  onMessage,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: applicant.id,
  })

  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false)
      }
    }
    function closeMenu() {
      setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    // Portal-rendered menu uses fixed coords captured at open; close on any
    // layout shift so it never floats detached from its trigger.
    window.addEventListener('scroll', closeMenu, true)
    window.addEventListener('resize', closeMenu)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      window.removeEventListener('scroll', closeMenu, true)
      window.removeEventListener('resize', closeMenu)
    }
  }, [menuOpen])

  const style: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {}

  const cardClass = [styles.card, isDragging ? styles.cardDragging : ''].filter(Boolean).join(' ')

  const displayName = `${applicant.workerFirstName} ${applicant.workerLastInitial}.`
  const isPaused = applicant.jobStatus === 'paused'
  const hasStatusIndicators =
    applicant.slaState === 'approaching' || applicant.slaState === 'breached' || applicant.flagged

  function handleBodyClick() {
    if (!isDragging) onCardClick(applicant)
  }

  function handleBodyKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onCardClick(applicant)
    }
  }

  function handleMenuTrigger(e: React.MouseEvent) {
    e.stopPropagation()
    if (!menuOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setMenuOpen((v) => !v)
  }

  function handleMenuAction(action: () => void) {
    setMenuOpen(false)
    action()
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cardClass}
      {...listeners}
      {...attributes}
      aria-label={`${displayName}, ${applicant.jobTitle}`}
    >
      {/* Avatar + text block (name + title), vertically centered as a unit */}
      <div
        className={styles.cardClickZone}
        onClick={handleBodyClick}
        onKeyDown={handleBodyKeyDown}
        role="button"
        tabIndex={0}
      >
        {/* Avatar */}
        {applicant.workerAvatar ? (
          <img
            src={applicant.workerAvatar}
            alt=""
            className={styles.avatarImg}
            aria-hidden="true"
          />
        ) : (
          <div className={styles.avatar} aria-hidden="true">
            {applicant.workerInitials}
          </div>
        )}

        {/* Name + title stacked */}
        <div className={styles.textBlock}>
          <div className={styles.nameRow}>
            <span className={styles.cardName}>{displayName}</span>
            {applicant.isRegulixReady && (
              <span
                className={styles.regulixBadge}
                title="Regulix Ready"
                aria-label="Regulix Ready"
              >
                <RegulixMarkIcon size={11} />
              </span>
            )}
          </div>
          <div className={styles.jobRow}>
            <span className={styles.cardJob}>{applicant.jobTitle}</span>
            {isPaused && <span className={styles.pausedTag}>Paused</span>}
          </div>
        </div>
      </div>

      {/* Overflow trigger */}
      <button
        ref={triggerRef}
        type="button"
        className={styles.overflowTrigger}
        onClick={handleMenuTrigger}
        aria-label="More options"
        aria-expanded={menuOpen}
      >
        <DotsHorizontalIcon size={14} />
      </button>

      {/* Status strip — only when there are indicators to show */}
      {hasStatusIndicators && (
        <div className={styles.statusStrip}>
          {applicant.slaState === 'approaching' && (
            <span className={styles.slaApproaching} title="SLA approaching">
              <WarningTriangleIcon size={11} />
            </span>
          )}
          {applicant.slaState === 'breached' && (
            <span className={styles.slaBreached} title="SLA breached">
              <DangerCircleIcon size={11} />
            </span>
          )}
          {applicant.flagged && (
            <span className={styles.flagIndicator} title="Flagged for attention">
              <FlagIcon size={11} />
            </span>
          )}
        </div>
      )}

      {/* Overflow dropdown — rendered in a portal so it escapes scrolling columns */}
      {menuOpen &&
        menuPos &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.overflowMenu}
            role="menu"
            style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, left: 'unset' }}
          >
            <button
              type="button"
              className={styles.overflowItem}
              role="menuitem"
              onClick={() => handleMenuAction(() => onReject(applicant))}
            >
              <CloseIcon size={13} />
              Reject
            </button>
            <button
              type="button"
              className={styles.overflowItem}
              role="menuitem"
              onClick={() => handleMenuAction(() => onHire(applicant))}
            >
              <CheckIcon size={13} />
              Mark hired
            </button>
            <button
              type="button"
              className={styles.overflowItem}
              role="menuitem"
              onClick={() => handleMenuAction(() => onCardClick(applicant))}
            >
              <PersonIcon size={13} />
              Open profile
            </button>
            {onMessage && (
              <button
                type="button"
                className={styles.overflowItem}
                role="menuitem"
                onClick={() => handleMenuAction(() => onMessage(applicant))}
              >
                <MessageIcon size={13} />
                Message
              </button>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}
