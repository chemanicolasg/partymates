import { describe, expect, it } from 'vitest'
import { FREE_PLAN, readPlan } from '../src/core/plans'

const NOW = Date.UTC(2026, 10, 17)
const DAY = 86400000

describe('plans', () => {
  it('is the free plan when the server says nothing, or nothing sensible', () => {
    expect(readPlan(null, NOW)).toEqual(FREE_PLAN)
    expect(readPlan('school', NOW)).toEqual(FREE_PLAN)
    expect(readPlan({}, NOW)).toEqual(FREE_PLAN)
  })

  it('reads a paid plan with its end and its limits', () => {
    const p = readPlan({ plan: 'school', until: NOW + 30 * DAY, since: NOW - 5 * DAY, limits: { groups: 120 } }, NOW)
    expect(p).toEqual({ plan: 'school', until: NOW + 30 * DAY, since: NOW - 5 * DAY, groups: 120 })
  })

  it('keeps a plan with no end', () => {
    expect(readPlan({ plan: 'family', until: null, limits: { groups: 40 } }, NOW).plan).toBe('family')
  })

  it('falls back to free once the plan has run out, without losing the account', () => {
    const p = readPlan({ plan: 'teacher', until: NOW - DAY, since: NOW - 400 * DAY, limits: { groups: 40 } }, NOW)
    expect(p.plan).toBe('free')
    expect(p.until).toBeNull()
    expect(p.since).toBe(NOW - 400 * DAY)
  })

  it('treats a plan this copy of the app does not know as free, never as an error', () => {
    expect(readPlan({ plan: 'district', limits: { groups: 500 } }, NOW)).toEqual({ ...FREE_PLAN, groups: 500 })
  })

  it('never lets a broken limit lock the account out', () => {
    expect(readPlan({ plan: 'free', limits: { groups: 0 } }, NOW).groups).toBe(FREE_PLAN.groups)
    expect(readPlan({ plan: 'free', limits: null }, NOW).groups).toBe(FREE_PLAN.groups)
  })
})
