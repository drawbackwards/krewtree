// In-memory cache keyed by (caller id, name). Lifetime is the page session —
// a refresh clears it. Used for company-scoped data that rarely changes within
// one session (skills list, coords, active-jobs dropdown). Failed loads are not
// cached so the next call retries.

const cache = new Map<string, unknown>()

function cacheKey(name: string, scope: string): string {
  return `${scope}::${name}`
}

/**
 * Return a cached value if present, otherwise run `loader` and cache its
 * result. Skips caching when `loader` returns a `{ error: non-null }` shape
 * so transient failures don't persist.
 */
export async function withSessionCache<T extends { error: string | null }>(
  name: string,
  scope: string,
  loader: () => Promise<T>
): Promise<T> {
  const key = cacheKey(name, scope)
  const hit = cache.get(key)
  if (hit !== undefined) return hit as T
  const result = await loader()
  if (result.error === null) cache.set(key, result)
  return result
}

/** Drop a specific (name, scope) entry. Call after a mutation that would
 *  invalidate the cached value — e.g. posting a new job invalidates the
 *  "active jobs" entry for that company. */
export function invalidateSessionCache(name: string, scope: string): void {
  cache.delete(cacheKey(name, scope))
}

/** Drop every cached value. Call on logout so a new account doesn't read the
 *  previous user's cached values. */
export function clearSessionCache(): void {
  cache.clear()
}
