import React from 'react'
import styles from './Label.module.css'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  disabled?: boolean
  hint?: string
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ required, disabled, hint, className, children, ...props }, ref) => {
    const cls = [
      styles.label,
      required ? styles.required : '',
      disabled ? styles.disabled : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <label ref={ref} className={cls} {...props}>
        {children}
        {hint && <span className={styles.hint}>{hint}</span>}
      </label>
    )
  }
)

Label.displayName = 'Label'
