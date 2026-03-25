import React, { createContext, useCallback, useContext, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  SuccessCircleIcon,
  WarningTriangleIcon,
  DangerCircleIcon,
  InfoCircleIcon,
  CloseIcon,
} from '../../site/icons'
import styles from './Toast.module.css'

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger'
export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'

export interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components -- hook is intentionally co-located with its provider
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

const toastIcons: Partial<Record<ToastVariant, React.ReactNode>> = {
  success: <SuccessCircleIcon size={18} color="var(--kt-success)" />,
  warning: <WarningTriangleIcon size={18} color="var(--kt-warning)" />,
  danger: <DangerCircleIcon size={18} color="var(--kt-danger)" />,
  info: <InfoCircleIcon size={18} color="var(--kt-navy-500)" />,
}

let _toastCounter = 0

export interface ToastProviderProps {
  children: React.ReactNode
  position?: ToastPosition
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (item: Omit<ToastItem, 'id'>) => {
      const id = String(++_toastCounter)
      setToasts((prev) => [...prev, { ...item, id }])
      const duration = item.duration ?? 4000
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration)
      }
    },
    [dismiss]
  )

  const containerCls = [styles.container, styles[position]].filter(Boolean).join(' ')

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {createPortal(
        <div className={containerCls} aria-live="polite" aria-atomic="false">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={[styles.toast, t.variant ? styles[t.variant] : '']
                .filter(Boolean)
                .join(' ')}
              role="status"
            >
              {t.variant && (
                <span className={styles.icon} aria-hidden="true">
                  {toastIcons[t.variant]}
                </span>
              )}
              <div className={styles.content}>
                <p className={styles.title}>{t.title}</p>
                {t.description && <p className={styles.description}>{t.description}</p>}
              </div>
              <button
                className={styles.closeBtn}
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
              >
                <CloseIcon size={14} />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}
