import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { KanbanStage } from '../../types'
import { ChevronDownIcon } from '../../icons'
import styles from './StagePicker.module.css'

const STAGE_LABEL: Record<KanbanStage, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
}

const ACTIVE_STAGES: KanbanStage[] = ['new', 'reviewed', 'interview', 'offer', 'hired']

export interface StagePickerProps {
  stage: KanbanStage
  onChange: (stage: KanbanStage) => void
  size?: 'sm' | 'md'
}

export const StagePicker: React.FC<StagePickerProps> = ({ stage, onChange, size = 'md' }) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node))
        return
      setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const pick = (next: KanbanStage) => {
    setOpen(false)
    if (next !== stage) onChange(next)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className={[styles.stageBtn, styles[`stage_${stage}`], styles[size]].join(' ')}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={styles.label}>{STAGE_LABEL[stage]}</span>
        <ChevronDownIcon size={size === 'sm' ? 10 : 12} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.menu}
            role="menu"
            style={{ top: pos.top, left: pos.left, minWidth: pos.width }}
          >
            {ACTIVE_STAGES.map((s) => (
              <button
                key={s}
                type="button"
                role="menuitem"
                onClick={() => pick(s)}
                className={[styles.item, s === stage ? styles.itemCurrent : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                {STAGE_LABEL[s]}
              </button>
            ))}
            <div className={styles.divider} />
            <button
              type="button"
              role="menuitem"
              onClick={() => pick('rejected')}
              className={[styles.item, styles.itemDanger].join(' ')}
            >
              {STAGE_LABEL.rejected}
            </button>
          </div>,
          document.body
        )}
    </>
  )
}
