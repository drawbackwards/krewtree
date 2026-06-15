import React, { useEffect, useId, useRef, useState } from 'react'
import { ChevronDownIcon, CloseIcon } from '../../site/icons'
import { Checkbox } from '../Checkbox'
import styles from './MultiSelect.module.css'

export type MultiSelectSize = 'sm' | 'md' | 'lg'

export interface MultiSelectOption {
  label: string
  value: string
  disabled?: boolean
}

export interface MultiSelectProps {
  size?: MultiSelectSize
  label?: string
  helperText?: string
  error?: string
  placeholder?: string
  options: MultiSelectOption[]
  value: string[]
  onChange: (next: string[]) => void
  required?: boolean
  disabled?: boolean
  id?: string
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  size = 'md',
  label,
  helperText,
  error,
  placeholder = 'Select…',
  options,
  value,
  onChange,
  required,
  disabled,
  id,
}) => {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Close on outside click or Escape — matches a native select's dismiss feel.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val))
    } else {
      onChange([...value, val])
    }
  }

  const remove = (val: string) => onChange(value.filter((v) => v !== val))

  const selected = options.filter((o) => value.includes(o.value))

  const triggerCls = [
    styles.trigger,
    size !== 'md' ? styles[size] : '',
    error ? styles.error : '',
    disabled ? styles.disabled : '',
    open ? styles.open : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.wrapper} ref={rootRef}>
      {label && (
        <label
          htmlFor={fieldId}
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

      <div className={styles.selectWrap}>
        <button
          type="button"
          id={fieldId}
          className={triggerCls}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={!!error}
          onClick={() => setOpen((o) => !o)}
        >
          {selected.length === 0 ? (
            <span className={styles.placeholder}>{placeholder}</span>
          ) : (
            <span className={styles.chips}>
              {selected.map((o) => (
                <span key={o.value} className={styles.chip}>
                  {o.label}
                  <span
                    role="button"
                    aria-label={`Remove ${o.label}`}
                    className={styles.chipRemove}
                    onClick={(e) => {
                      e.stopPropagation()
                      remove(o.value)
                    }}
                  >
                    <CloseIcon size={11} />
                  </span>
                </span>
              ))}
            </span>
          )}
          <span className={styles.chevron} aria-hidden="true">
            <ChevronDownIcon size={16} />
          </span>
        </button>

        {open && (
          <div className={styles.panel} role="listbox">
            {options.map((opt) => (
              <div key={opt.value} className={styles.option}>
                <Checkbox
                  label={opt.label}
                  checked={value.includes(opt.value)}
                  disabled={opt.disabled}
                  onChange={() => toggle(opt.value)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <span className={styles.errorText} role="alert">
          {error}
        </span>
      )}
      {!error && helperText && <span className={styles.helperText}>{helperText}</span>}
    </div>
  )
}

MultiSelect.displayName = 'MultiSelect'
