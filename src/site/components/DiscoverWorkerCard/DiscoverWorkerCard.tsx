import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { RegulixBadge } from '../RegulixBadge/RegulixBadge'
import { CheckIcon, DotsHorizontalIcon, LocationIcon } from '../../icons'
import type { DiscoverWorker } from '../../services/krewService'
import styles from './DiscoverWorkerCard.module.css'

export interface DiscoverWorkerCardProps {
  worker: DiscoverWorker
  isAdding?: boolean
  onAddToKrew: () => void
  onRemoveFromKrew?: () => void
  onViewProfile: () => void
  onMessage?: () => void
}

const SKILL_LIMIT = 3

type OverflowItem = { label: string; onClick: () => void; disabled?: boolean }

const OverflowMenu: React.FC<{ items: OverflowItem[] }> = ({ items }) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent): void => {
      if (
        btnRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const toggle = (e: React.MouseEvent): void => {
    e.stopPropagation()
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
    }
    setOpen((v) => !v)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={styles.iconBtn}
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More actions"
      >
        <DotsHorizontalIcon size={16} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.overflowMenu}
            role="menu"
            style={{ top: pos.top, right: pos.right }}
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={styles.overflowItem}
                disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  setOpen(false)
                  if (!item.disabled) item.onClick()
                }}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}

export const DiscoverWorkerCard: React.FC<DiscoverWorkerCardProps> = ({
  worker,
  isAdding = false,
  onAddToKrew,
  onRemoveFromKrew,
  onViewProfile,
  onMessage,
}) => {
  const initials = `${worker.firstName[0] ?? ''}${worker.lastName[0] ?? ''}`.toUpperCase()
  const fullName =
    [worker.firstName, worker.lastName].filter(Boolean).join(' ').trim() ||
    worker.primaryTrade ||
    'Worker'

  const overflowItems: OverflowItem[] = []
  if (worker.inKrew) {
    if (onRemoveFromKrew) {
      overflowItems.push({ label: 'Remove from Krew', onClick: onRemoveFromKrew })
    }
  } else {
    overflowItems.push({
      label: isAdding ? 'Adding…' : 'Add to Krew',
      onClick: onAddToKrew,
      disabled: isAdding,
    })
  }
  if (onMessage) {
    overflowItems.push({ label: 'Message', onClick: onMessage })
  }

  return (
    <article
      className={styles.card}
      onClick={onViewProfile}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onViewProfile()}
      aria-label={`${fullName} — view profile`}
    >
      <div className={styles.header}>
        <div className={styles.avatar}>
          {worker.avatarUrl ? <img src={worker.avatarUrl} alt="" /> : initials || '?'}
        </div>
        <div className={styles.headerText}>
          <div className={styles.nameRow}>
            <p className={styles.workerName}>{fullName}</p>
            {worker.isRegulixReady && <RegulixBadge size="sm" />}
          </div>
          {worker.primaryTrade && <span className={styles.subtitle}>{worker.primaryTrade}</span>}
        </div>
      </div>

      {(worker.location ||
        (worker.jobMatch && worker.jobMatch.score > 0) ||
        worker.distanceMi != null) && (
        <div className={styles.meta}>
          {worker.location && (
            <span className={styles.metaItem}>
              <span className={styles.metaIcon}>
                <LocationIcon size={13} />
              </span>
              {worker.location}
            </span>
          )}
          {worker.jobMatch && worker.jobMatch.score > 0 && (
            <span className={styles.matchPill}>
              {[
                worker.jobMatch.matchedSkills.length > 0 &&
                  `${worker.jobMatch.matchedSkills.length} skill${worker.jobMatch.matchedSkills.length === 1 ? '' : 's'}`,
                worker.jobMatch.locationMatch && 'Same city',
                worker.jobMatch.tradeMatch && 'Title match',
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          )}
          {worker.distanceMi != null && (
            <span className={styles.matchPill}>
              {worker.distanceMi < 1 ? '< 1 mi away' : `${Math.round(worker.distanceMi)} mi away`}
            </span>
          )}
        </div>
      )}

      {worker.bio && <p className={styles.bio}>{worker.bio}</p>}

      <div className={styles.footer}>
        {worker.topSkills.length > 0 ? (
          <div className={styles.skills}>
            {worker.topSkills.slice(0, SKILL_LIMIT).map((skill) => (
              <span key={skill} className={styles.skillTag}>
                {skill}
              </span>
            ))}
            {worker.topSkills.length > SKILL_LIMIT && (
              <span className={styles.skillMore}>+{worker.topSkills.length - SKILL_LIMIT}</span>
            )}
          </div>
        ) : (
          <span />
        )}

        <div className={styles.actions}>
          {worker.inKrew && (
            <span className={styles.krewPill}>
              <CheckIcon size={14} />
              In Krew
            </span>
          )}
          <button
            type="button"
            className={styles.viewBtn}
            onClick={(e) => {
              e.stopPropagation()
              onViewProfile()
            }}
          >
            View Profile
          </button>
          <OverflowMenu items={overflowItems} />
        </div>
      </div>
    </article>
  )
}
