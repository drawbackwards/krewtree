/** Returns the number of whole days elapsed since an ISO date string. */
export const daysSince = (iso: string): number =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
