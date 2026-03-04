import React from 'react'
import styles from './Divider.module.css'

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  strong?: boolean
  label?: string
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  strong = false,
  label,
  className,
  ...props
}) => {
  const cls = [
    styles.divider,
    orientation === 'vertical' ? styles.vertical : '',
    strong ? styles.strong : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  if (label) {
    return (
      <div className={cls} role="separator" {...props}>
        <div className={styles.line} />
        <span>{label}</span>
        <div className={styles.line} />
      </div>
    )
  }

  return <hr className={[styles.line, strong ? styles.strong : '', className ?? ''].filter(Boolean).join(' ')} role="separator" {...(props as React.HTMLAttributes<HTMLHRElement>)} />
}
