import React, { useState } from 'react'
import {
  InfoCircleIcon,
  SuccessCircleIcon,
  WarningTriangleIcon,
  DangerCircleIcon,
  CloseIcon,
} from '../../site/icons'
import styles from './Alert.module.css'

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
  title?: string
  description?: string
  icon?: React.ReactNode
  closable?: boolean
  onClose?: () => void
}

const icons: Record<AlertVariant, React.ReactNode> = {
  info: <InfoCircleIcon size={18} />,
  success: <SuccessCircleIcon size={18} />,
  warning: <WarningTriangleIcon size={18} />,
  danger: <DangerCircleIcon size={18} />,
  neutral: <InfoCircleIcon size={18} />,
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  description,
  icon,
  closable = false,
  onClose,
  className,
  children,
  ...props
}) => {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  const handleClose = () => {
    setVisible(false)
    onClose?.()
  }

  return (
    <div
      className={[styles.alert, styles[variant], className ?? ''].filter(Boolean).join(' ')}
      role="alert"
      {...props}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon ?? icons[variant]}
      </span>
      <div className={styles.content}>
        {title && <p className={styles.title}>{title}</p>}
        {description && <p className={styles.description}>{description}</p>}
        {children}
      </div>
      {closable && (
        <button className={styles.closeBtn} onClick={handleClose} aria-label="Dismiss">
          <CloseIcon size={14} />
        </button>
      )}
    </div>
  )
}
