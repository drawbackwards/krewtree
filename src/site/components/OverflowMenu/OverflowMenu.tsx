import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DotsHorizontalIcon } from '../../icons'
import styles from './OverflowMenu.module.css'

export type OverflowItem = { label: string; danger?: boolean; onClick: () => void }

/**
 * A "⋯" kebab button that opens a small action list, portalled to <body> and
 * anchored below-right of the trigger. Closes on outside click or Escape.
 * Extracted from the applicants list so row-action menus share one implementation.
 */
export const OverflowMenu: React.FC<{ items: OverflowItem[]; label?: string }> = ({
  items,
  label = 'More actions',
}) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
    }
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node))
        return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={styles.overflowBtn}
        onClick={handleToggle}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <DotsHorizontalIcon size={14} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className={styles.overflowMenu}
            style={{ top: pos.top, right: pos.right }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={[styles.overflowItem, item.danger ? styles.danger : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  item.onClick()
                  setOpen(false)
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

export default OverflowMenu
