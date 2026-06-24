import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { DotsVerticalIcon, ChevronRightIcon } from '../../icons'
import { getMessageTemplates, type MessageTemplate } from '../../services/messageTemplateService'
import styles from './ComposerMenu.module.css'

/**
 * Overflow (kebab) menu for the message composers, sitting to the right of
 * the Send button. Today it holds a single "Templates ›" option whose
 * submenu lists the company's saved message templates; it's structured so
 * more options can be added alongside Templates later.
 *
 * The menu is portalled to <body> so it isn't clipped by the docked chat
 * pane's overflow. Company persona only — mount it conditionally.
 */
export const ComposerMenu: React.FC<{
  companyId: string
  disabled?: boolean
  onInsert: (text: string) => void
}> = ({ companyId, disabled, onInsert }) => {
  const [open, setOpen] = useState(false)
  const [submenuOpen, setSubmenuOpen] = useState(false)
  const [templates, setTemplates] = useState<MessageTemplate[] | null>(null)
  const [pos, setPos] = useState({ right: 0, bottom: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Load templates lazily the first time the menu opens.
  useEffect(() => {
    if (!open || templates !== null || !companyId) return
    let cancelled = false
    getMessageTemplates(companyId).then(({ data }) => {
      if (!cancelled) setTemplates(data)
    })
    return () => {
      cancelled = true
    }
  }, [open, templates, companyId])

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent): void => {
      if (btnRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node))
        return
      close()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  function close(): void {
    setOpen(false)
    setSubmenuOpen(false)
  }

  function toggle(): void {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      // Anchor the menu's bottom-right just above the kebab so it opens upward.
      setPos({ right: window.innerWidth - r.right, bottom: window.innerHeight - r.top + 6 })
    }
    setSubmenuOpen(false)
    setOpen((v) => !v)
  }

  function choose(t: MessageTemplate): void {
    onInsert(t.body)
    close()
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={styles.kebab}
        onClick={toggle}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More options"
        title="More options"
      >
        <DotsVerticalIcon size={18} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.menu}
            style={{ right: pos.right, bottom: pos.bottom }}
            role="menu"
          >
            <div
              className={styles.itemWrap}
              onMouseEnter={() => setSubmenuOpen(true)}
              onMouseLeave={() => setSubmenuOpen(false)}
            >
              <button
                type="button"
                className={styles.option}
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={submenuOpen}
                onClick={() => setSubmenuOpen((v) => !v)}
              >
                <span>Templates</span>
                <ChevronRightIcon size={14} />
              </button>

              {submenuOpen && (
                <div className={styles.submenu} role="menu">
                  {templates === null ? (
                    <p className={styles.hint}>Loading…</p>
                  ) : templates.length === 0 ? (
                    <p className={styles.hint}>
                      No templates yet.{' '}
                      <Link to="/site/settings/templates" className={styles.hintLink}>
                        Create one
                      </Link>
                    </p>
                  ) : (
                    templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={styles.templateItem}
                        role="menuitem"
                        onClick={() => choose(t)}
                      >
                        <span className={styles.templateName}>{t.name}</span>
                        <span className={styles.templatePreview}>{t.body}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
