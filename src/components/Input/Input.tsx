import React from 'react'
import styles from './Input.module.css'

export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize
  label?: string
  helperText?: string
  error?: string
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  required?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      label,
      helperText,
      error,
      leadingIcon,
      trailingIcon,
      required,
      id,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined)

    const wrapCls = [
      styles.inputWrap,
      styles[size],
      leadingIcon ? styles.hasLeading : '',
      trailingIcon ? styles.hasTrailing : '',
    ]
      .filter(Boolean)
      .join(' ')

    const inputCls = [styles.input, error ? styles.error : '', className ?? '']
      .filter(Boolean)
      .join(' ')

    return (
      <div className={styles.wrapper}>
        {label && (
          <label
            htmlFor={inputId}
            className={[
              styles.label,
              required ? styles.required : '',
              disabled ? styles.disabled : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-medium)',
              color: 'var(--kt-text)',
            }}
          >
            {label}
            {required && <span style={{ color: 'var(--kt-danger)', marginLeft: 2 }}>*</span>}
          </label>
        )}
        <div className={wrapCls}>
          {leadingIcon && (
            <span className={styles.leadingIcon} aria-hidden="true">
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={inputCls}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-hint` : undefined
            }
            {...props}
          />
          {trailingIcon && (
            <span className={styles.trailingIcon} aria-hidden="true">
              {trailingIcon}
            </span>
          )}
        </div>
        {error && (
          <span id={`${inputId}-error`} className={styles.errorText} role="alert">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={`${inputId}-hint`} className={styles.helperText}>
            {helperText}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
