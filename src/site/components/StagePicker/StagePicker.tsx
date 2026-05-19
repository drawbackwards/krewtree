import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PipelineStage } from '../../services/pipelineService'
import { ChevronDownIcon } from '../../icons'
import styles from './StagePicker.module.css'

export interface StagePickerProps {
  currentStageId: string
  currentStageName: string
  stages: PipelineStage[]
  onChange: (stageId: string) => void
  size?: 'sm' | 'md'
}

export const StagePicker: React.FC<StagePickerProps> = ({
  currentStageId,
  currentStageName,
  stages,
  onChange,
  size = 'md',
}) => {
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

  const pick = (stageId: string) => {
    setOpen(false)
    if (stageId !== currentStageId) onChange(stageId)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className={[styles.stageBtn, styles.stageActive, styles[size]].join(' ')}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={styles.label}>{currentStageName}</span>
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
            {stages.map((s) => (
              <button
                key={s.id}
                type="button"
                role="menuitem"
                onClick={() => pick(s.id)}
                className={[styles.item, s.id === currentStageId ? styles.itemCurrent : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                {s.name}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}
