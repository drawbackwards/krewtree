import React, { useState, useId } from 'react'
import styles from './Tooltip.module.css'

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps {
  content: React.ReactNode
  position?: TooltipPosition
  children: React.ReactElement
  disabled?: boolean
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  children,
  disabled = false,
}) => {
  const [visible, setVisible] = useState(false)
  const id = useId()

  if (disabled) return children

  return (
    <span
      className={styles.wrap}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {React.cloneElement(children, {
        'aria-describedby': id,
      })}
      {visible && (
        <span
          id={id}
          role="tooltip"
          className={[styles.tooltip, styles[position]].join(' ')}
        >
          {content}
        </span>
      )}
    </span>
  )
}
