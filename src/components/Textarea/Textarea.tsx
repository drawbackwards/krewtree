import React, { useState } from 'react'
import styles from './Textarea.module.css'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
  error?: string
  maxChars?: number
  noResize?: boolean
  required?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      maxChars,
      noResize = false,
      required,
      id,
      className,
      disabled,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue ?? '')
    const controlled = value !== undefined
    const currentValue = controlled ? String(value) : String(internalValue)
    const charCount = currentValue.length
    const overLimit = maxChars !== undefined && charCount > maxChars

    const textareaId = id ?? (label ? `textarea-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined)

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!controlled) setInternalValue(e.target.value)
      onChange?.(e)
    }

    const cls = [
      styles.textarea,
      error ? styles.error : '',
      noResize ? styles.noResize : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={styles.wrapper}>
        {label && (
          <label
            htmlFor={textareaId}
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
        <textarea
          ref={ref}
          id={textareaId}
          className={cls}
          disabled={disabled}
          value={controlled ? value : internalValue}
          onChange={handleChange}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-hint` : undefined}
          {...props}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            {error && (
              <span id={`${textareaId}-error`} className={styles.errorText} role="alert">
                {error}
              </span>
            )}
            {!error && helperText && (
              <span id={`${textareaId}-hint`} className={styles.helperText}>
                {helperText}
              </span>
            )}
          </span>
          {maxChars !== undefined && (
            <span className={[styles.charCount, overLimit ? styles.overLimit : ''].filter(Boolean).join(' ')}>
              {charCount}/{maxChars}
            </span>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
