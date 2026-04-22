export interface MatchInput {
  workerSkills: string[]
  jobSkills: string[]
  workerCity: string
  jobCity: string
}

export interface MatchResult {
  total: number
  skills: number
  location: number
}

/**
 * Simple 50/50 weighted match score for an application.
 * Skills pillar = % of job-required skills the worker has.
 * Location pillar = 100 if cities match case-insensitively, else 0.
 * Both pillars are integers 0-100. `total` is the integer average.
 *
 * Reference implementation — not called at runtime. The live match_score
 * on `applications` is computed by the Postgres `compute_match_score`
 * function (migration 20260422000004). Kept here as tested documentation
 * of the canonical client-side formula for future use.
 */
export function computeMatch({
  workerSkills,
  jobSkills,
  workerCity,
  jobCity,
}: MatchInput): MatchResult {
  const skills = pctSkillOverlap(workerSkills, jobSkills)
  const location = sameCity(workerCity, jobCity) ? 100 : 0
  const total = Math.round((skills + location) / 2)
  return { total, skills, location }
}

function pctSkillOverlap(worker: string[], job: string[]): number {
  if (job.length === 0) return 100
  const workerSet = new Set(worker.map((s) => s.trim().toLowerCase()))
  const hit = job.filter((s) => workerSet.has(s.trim().toLowerCase())).length
  return Math.round((hit / job.length) * 100)
}

function sameCity(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase() && a.trim() !== ''
}
