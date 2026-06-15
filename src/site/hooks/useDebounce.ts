import { useEffect, useState } from 'react'

/**
 * Returns a value that trails `value` by `delayMs`. Used to keep text inputs
 * responsive while holding back the queries they drive until typing pauses.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
