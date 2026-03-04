import React from 'react'
import styles from './Card.module.css'

export type CardSize = 'sm' | 'md' | 'lg'
export type CardShadow = 'flat' | 'raised' | 'elevated'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: CardSize
  shadow?: CardShadow
  interactive?: boolean
}

export const Card: React.FC<CardProps> = ({
  size = 'md',
  shadow = 'flat',
  interactive = false,
  className,
  children,
  ...props
}) => {
  const cls = [
    styles.card,
    styles[size],
    styles[shadow],
    interactive ? styles.interactive : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cls} {...props}>
      {children}
    </div>
  )
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  action?: React.ReactNode
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  description,
  action,
  className,
  children,
  ...props
}) => (
  <div className={[styles.header, className ?? ''].filter(Boolean).join(' ')} {...props}>
    <div>
      {title && <p className={styles.title}>{title}</p>}
      {description && <p className={styles.description}>{description}</p>}
      {children}
    </div>
    {action && <div>{action}</div>}
  </div>
)

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={[styles.body, className ?? ''].filter(Boolean).join(' ')} {...props}>
    {children}
  </div>
)

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={[styles.footer, className ?? ''].filter(Boolean).join(' ')} {...props}>
    {children}
  </div>
)
