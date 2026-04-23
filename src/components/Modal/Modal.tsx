import React, { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon } from '../../site/icons'
import styles from './Modal.module.css'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ModalProps {
  open: boolean
  onClose: () => void
  size?: ModalSize
  title?: React.ReactNode
  description?: string
  headerExtra?: React.ReactNode
  showClose?: boolean
  closeOnOverlay?: boolean
  mobileDrawer?: boolean
  children?: React.ReactNode
  footer?: React.ReactNode
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  size = 'md',
  title,
  description,
  headerExtra,
  showClose = true,
  closeOnOverlay = true,
  mobileDrawer = false,
  children,
  footer,
}) => {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, handleKey])

  if (!open) return null

  return createPortal(
    <div
      className={[styles.overlay, mobileDrawer ? styles.mobileDrawer : '']
        .filter(Boolean)
        .join(' ')}
      onClick={closeOnOverlay ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className={[styles.modal, styles[size]].join(' ')} onClick={(e) => e.stopPropagation()}>
        {(title || showClose || headerExtra) && (
          <div className={styles.header}>
            <div className={styles.titleWrap}>
              {title && (
                <h2 id="modal-title" className={styles.title}>
                  {title}
                </h2>
              )}
              {description && <p className={styles.description}>{description}</p>}
            </div>
            {headerExtra && <div className={styles.headerExtra}>{headerExtra}</div>}
            {showClose && (
              <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
                <CloseIcon size={18} />
              </button>
            )}
          </div>
        )}
        {children && <div className={styles.body}>{children}</div>}
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
