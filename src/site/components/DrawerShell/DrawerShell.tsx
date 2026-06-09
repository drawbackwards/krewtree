import React from 'react'
import { createPortal } from 'react-dom'
import styles from './DrawerShell.module.css'

export interface DrawerShellProps {
  /** True when this shell is the top of a stacked pair. Uses a transparent scrim
   *  so the base panel stays visible underneath; the layered panel sits flush
   *  right and overlaps the base. */
  isTop: boolean
  /** Fires when the user clicks the scrim. The system decides whether this peels
   *  the top of the stack or closes the only drawer. */
  onClose: () => void
  ariaLabel?: string
  children: React.ReactNode
}

export const DrawerShell: React.FC<DrawerShellProps> = ({
  isTop,
  onClose,
  ariaLabel,
  children,
}) => {
  return createPortal(
    <div
      className={[styles.overlay, isTop ? styles.overlayTop : ''].filter(Boolean).join(' ')}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <aside
        className={[styles.panel, isTop ? styles.panelTop : ''].filter(Boolean).join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </aside>
    </div>,
    document.body
  )
}
