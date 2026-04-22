import { describe, expect, it } from 'vitest'
import { computeMatch } from '../matchScore'

describe('computeMatch', () => {
  it('returns 0 when neither skills nor location match', () => {
    expect(
      computeMatch({
        workerSkills: ['Plumbing'],
        jobSkills: ['Carpentry'],
        workerCity: 'Phoenix',
        jobCity: 'Denver',
      })
    ).toEqual({ total: 0, skills: 0, location: 0 })
  })

  it('returns 100 when all skills overlap and city matches exactly', () => {
    expect(
      computeMatch({
        workerSkills: ['Carpentry', 'Framing'],
        jobSkills: ['Carpentry', 'Framing'],
        workerCity: 'Phoenix',
        jobCity: 'Phoenix',
      })
    ).toEqual({ total: 100, skills: 100, location: 100 })
  })

  it('skills are % of job skills the worker covers (case-insensitive)', () => {
    // Worker has 1 of 2 job skills = 50% skills
    // Location match = 100%
    // Average = 75%
    expect(
      computeMatch({
        workerSkills: ['carpentry', 'Electrical'],
        jobSkills: ['Carpentry', 'Welding'],
        workerCity: 'Phoenix',
        jobCity: 'PHOENIX',
      })
    ).toEqual({ total: 75, skills: 50, location: 100 })
  })

  it('empty job skills → skills pillar is 100 (nothing required)', () => {
    expect(
      computeMatch({
        workerSkills: [],
        jobSkills: [],
        workerCity: 'Phoenix',
        jobCity: 'Phoenix',
      })
    ).toEqual({ total: 100, skills: 100, location: 100 })
  })
})
