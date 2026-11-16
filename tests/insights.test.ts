import { describe, expect, it } from 'vitest'
import type { MemberReport } from '../src/core/backend'
import { classKpis, csvReport, familyLink, fmtMinutes, joinLink, PLAN, pupilLine, readJoinLink } from '../src/core/insights'
import { readFamilyLink } from '../src/core/invite'
import { accountError } from '../src/core/account'

const WEEK = '2026-11-16'
const pupil = (num: number, over: Partial<MemberReport['stats']> = {}, weeks: MemberReport['weeks'] = []): MemberReport => ({
  id: `id${num}`,
  name: `P${num}`,
  num,
  look: '',
  stars: num * 3,
  xp: 0,
  updatedAt: Date.UTC(2026, 10, 17),
  weeks,
  stats: { week: WEEK, weekMin: 0, byKind: {}, dojo: 0, weak: [], hw: null, ...over },
})

describe('a pupil in the report', () => {
  it('follows the plan with enough days, however many minutes', () => {
    expect(pupilLine(pupil(1, { weekMin: 70, days: PLAN.days }), WEEK).onPlan).toBe(true)
    expect(pupilLine(pupil(1, { weekMin: 200, days: 2 }), WEEK).onPlan).toBe(false)
  })

  it('counts nothing from a week that is not this one', () => {
    const l = pupilLine(pupil(1, { week: '2026-11-09', weekMin: 50, days: 5, totalMin: 300 }), WEEK)
    expect([l.active, l.weekMin, l.days, l.onPlan, l.totalMin]).toEqual([false, 0, 0, false, 300])
  })

  it('names a strong and a weak activity only with enough answers and a real gap', () => {
    const few = pupilLine(pupil(1, { byKind: { blocks: { ok: 1, total: 3 }, arena: { ok: 3, total: 3 } } }), WEEK)
    expect([few.strongest, few.weakest, few.accuracy]).toEqual([null, null, null])
    const even = pupilLine(pupil(1, { byKind: { blocks: { ok: 18, total: 20 }, arena: { ok: 17, total: 20 } } }), WEEK)
    expect([even.strongest, even.weakest]).toEqual([null, null])
    const gap = pupilLine(pupil(1, { byKind: { blocks: { ok: 19, total: 20 }, arena: { ok: 9, total: 20 }, bay: { ok: 15, total: 20 } } }), WEEK)
    expect([gap.strongest, gap.weakest, gap.accuracy]).toEqual(['blocks', 'arena', 72])
  })
})

describe('a class in the report', () => {
  const members = [
    pupil(1, { weekMin: 60, days: 4, byKind: { arena: { ok: 10, total: 20 }, blocks: { ok: 19, total: 20 } }, weak: ['7x8', '6x7'] }, [
      { week: '2026-11-09', min: 30, days: 2, stars: 2 },
      { week: WEEK, min: 60, days: 4, stars: 3 },
    ]),
    pupil(2, { weekMin: 20, days: 1, byKind: { arena: { ok: 12, total: 20 } }, weak: ['7x8'] }, [{ week: WEEK, min: 20, days: 1, stars: 6 }]),
    pupil(3, { week: '2026-11-02', weekMin: 90, days: 5 }, [{ week: '2026-11-02', min: 90, days: 5, stars: 9 }]),
  ]
  const k = classKpis(members, WEEK)

  it('adds up who played, how long and who keeps the routine', () => {
    expect([k.pupils, k.active, k.onPlan, k.minutes]).toEqual([3, 2, 1, 40])
  })

  it('finds what the class is good at, what it needs and the facts most missed', () => {
    expect([k.strongest, k.weakest, k.accuracy]).toEqual(['blocks', 'arena', 68])
    expect(k.hard[0]).toEqual(['7x8', 2])
  })

  it('lines the weeks up, oldest first', () => {
    expect(k.series).toEqual([
      { week: '2026-11-02', min: 90, active: 1 },
      { week: '2026-11-09', min: 30, active: 1 },
      { week: WEEK, min: 80, active: 2 },
    ])
  })

  it('copes with an empty class', () => {
    const e = classKpis([], WEEK)
    expect([e.pupils, e.active, e.minutes, e.accuracy, e.series.length]).toEqual([0, 0, 0, null, 0])
  })

  it('exports a spreadsheet that cannot smuggle a formula in', () => {
    const csv = csvReport(members, WEEK, { 1: '=HYPERLINK("x")', 2: 'Luna; la de 3.º' }, { 2: 'dice "hola"' }, ['n', 'name'], (kind) => kind)
    const [head, first, second] = csv.split('\r\n')
    expect(head).toBe('n;name')
    expect(first.startsWith(`1;"'=HYPERLINK(""x"")";3;60;4;60;73;blocks;arena;7x8 6x7;2026-11-17;`)).toBe(true)
    expect(second).toContain('"Luna; la de 3.º"')
    expect(second.endsWith('"dice ""hola"""')).toBe(true)
  })
})

describe('getting in', () => {
  it('builds and reads the link on a pupil card', () => {
    expect(joinLink('https://x.app', 'ABC123', 7)).toBe('https://x.app/?clase=ABC123&n=7')
    expect(readJoinLink('?clase=abc123&n=7')).toEqual({ code: 'ABC123', num: 7 })
    expect(readJoinLink('?clase=ABC123')).toEqual({ code: 'ABC123', num: null })
    expect(readJoinLink('?clase=ABC123&n=700')).toEqual({ code: 'ABC123', num: null })
    expect(readJoinLink('?clase=<script>')).toBeNull()
    expect(readJoinLink('')).toBeNull()
  })

  it('builds and reads the link that connects a child to their family', () => {
    expect(familyLink('https://x.app', 'FAM123')).toBe('https://x.app/?familia=FAM123')
    expect(readFamilyLink('?familia=fam123')).toBe('FAM123')
    expect(readFamilyLink('?familia=nope')).toBeNull()
    expect(readFamilyLink('?clase=ABC123')).toBeNull()
  })

  it('shows minutes the way a person says them', () => {
    expect([fmtMinutes(0), fmtMinutes(45), fmtMinutes(60), fmtMinutes(125)]).toEqual(['0 min', '45 min', '1 h 00', '2 h 05'])
  })

  it('turns the sign-in service messages into reasons the screen can explain', () => {
    expect(accountError('Invalid login credentials')).toBe('bad')
    expect(accountError('User already registered')).toBe('exists')
    expect(accountError('Email not confirmed')).toBe('unconfirmed')
    expect(accountError('Password should be at least 6 characters')).toBe('weak')
    expect(accountError('email rate limit exceeded')).toBe('rate')
    expect(accountError('Email address "x" is invalid')).toBe('email')
    expect(accountError(undefined)).toBe('other')
  })
})
