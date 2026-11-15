import { int, shuffle, type Rnd } from './generators'
import type { Band } from './types'

/**
 * "Explorer Mission": five short tasks on the foundations of number, modelled on the paradigms
 * used in number-sense research (dot enumeration, comparing quantities and digits, placing numbers
 * on a line, retrieving simple facts).
 *
 * It is an observation aid for teachers, NOT a diagnosis and NOT a normed test: results are only
 * compared inside the class, and a low profile is a reason to look closer and talk to the school's
 * guidance team, nothing more.
 */
export type TaskId = 'dots' | 'cmpDots' | 'cmpNum' | 'line' | 'facts'
export const TASKS: TaskId[] = ['dots', 'cmpDots', 'cmpNum', 'line', 'facts']
/** The tasks that look at number sense itself, rather than at learned arithmetic. */
export const CORE_TASKS: TaskId[] = ['dots', 'cmpDots', 'cmpNum', 'line']

export interface Dot {
  x: number
  y: number
  r: number
}

export type Trial =
  | { task: 'dots'; n: number; dots: Dot[]; answer: number }
  | { task: 'cmpDots'; left: Dot[]; right: Dot[]; answer: 'left' | 'right' }
  | { task: 'cmpNum'; left: number; right: number; answer: 'left' | 'right' }
  | { task: 'line'; target: number; max: number; answer: number }
  | { task: 'facts'; a: number; b: number; op: 'add' | 'sub'; answer: number }

/** Scatters `n` dots of radius `r` on a 100×70 field without touching each other. */
export function dotLayout(n: number, r: number, rnd: Rnd = Math.random): Dot[] {
  const dots: Dot[] = []
  for (let guard = 0; dots.length < n && guard < 4000; guard++) {
    const d = { x: r + 2 + rnd() * (96 - 2 * r), y: r + 2 + rnd() * (66 - 2 * r), r }
    if (dots.every((o) => Math.hypot(o.x - d.x, o.y - d.y) > 2 * r + 1.5)) dots.push(d)
  }
  return dots
}

const side = (rnd: Rnd): 'left' | 'right' => (rnd() < 0.5 ? 'left' : 'right')

/** Pairs get harder as the two quantities get closer (ratios from 1:2 to 5:6). */
const DOT_PAIRS: [number, number][] = [[4, 8], [5, 10], [7, 14], [6, 9], [8, 12], [10, 15], [6, 8], [9, 12], [12, 16], [8, 10], [12, 15], [15, 18]]
const DIGIT_PAIRS: [number, number][] = [[1, 2], [3, 4], [5, 6], [8, 9], [6, 7], [2, 4], [5, 7], [6, 8], [3, 5], [1, 4], [3, 7], [4, 8], [2, 9], [1, 7]]
const TWO_DIGIT_PAIRS: [number, number][] = [[12, 21], [36, 63], [47, 52], [58, 61], [29, 41], [69, 73]]
const LINE_TARGETS: Record<Band, { max: number; targets: number[] }> = {
  A: { max: 10, targets: [2, 7, 4, 9, 3, 6] },
  B: { max: 100, targets: [18, 71, 4, 48, 86, 33, 62, 25] },
  C: { max: 100, targets: [18, 71, 4, 48, 86, 33, 62, 25] },
  D: { max: 1000, targets: [180, 710, 40, 480, 860, 330, 620, 250] },
}

function factTrials(band: Band, rnd: Rnd): Trial[] {
  const out: Trial[] = []
  const seen = new Set<string>()
  const top = band === 'A' ? 6 : band === 'B' ? 10 : 18
  const count = band === 'A' ? 8 : 10
  for (let guard = 0; out.length < count && guard < 500; guard++) {
    const add = band === 'A' || rnd() < 0.6
    const a = add ? int(1, Math.min(9, top - 1), rnd) : int(3, top, rnd)
    const b = add ? int(1, Math.min(9, top - a), rnd) : int(1, Math.min(9, a - 1), rnd)
    const key = `${a}${add ? '+' : '-'}${b}`
    if (b < 1 || seen.has(key)) continue
    seen.add(key)
    out.push({ task: 'facts', a, b, op: add ? 'add' : 'sub', answer: add ? a + b : a - b })
  }
  return out
}

/** The trials of one task, in the order they are shown. The first `practice` ones do not count. */
export function buildTask(task: TaskId, band: Band, rnd: Rnd = Math.random): { practice: number; trials: Trial[] } {
  switch (task) {
    case 'dots': {
      const sizes = band === 'A' ? [1, 2, 3, 4, 5, 6, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6, 7, 8, 2, 3, 4, 6]
      const make = (n: number): Trial => ({ task, n, dots: dotLayout(n, 5.5, rnd), answer: n })
      return { practice: 2, trials: [make(2), make(5), ...shuffle(sizes, rnd).map(make)] }
    }
    case 'cmpDots': {
      // Half the time the bigger group has the smaller dots, so "more ink" is not a reliable cue.
      const make = ([a, b]: [number, number], i: number): Trial => {
        const answer = side(rnd)
        const [rMore, rFew] = i % 2 ? [3.2, 4.6] : [4.2, 4.2]
        const more = dotLayout(b, rMore, rnd)
        const few = dotLayout(a, rFew, rnd)
        return { task, left: answer === 'left' ? more : few, right: answer === 'right' ? more : few, answer }
      }
      return { practice: 2, trials: [make([2, 6], 0), make([3, 9], 0), ...shuffle(DOT_PAIRS, rnd).map(make)] }
    }
    case 'cmpNum': {
      const pairs = band === 'C' || band === 'D' ? [...DIGIT_PAIRS.slice(0, 8), ...TWO_DIGIT_PAIRS] : DIGIT_PAIRS
      const make = ([a, b]: [number, number]): Trial => {
        const answer = side(rnd)
        return { task, left: answer === 'left' ? b : a, right: answer === 'right' ? b : a, answer }
      }
      return { practice: 2, trials: [make([2, 8]), make([1, 5]), ...shuffle(pairs, rnd).map(make)] }
    }
    case 'line': {
      const { max, targets } = LINE_TARGETS[band]
      const make = (target: number): Trial => ({ task, target, max, answer: target })
      return { practice: 1, trials: [make(max / 2), ...shuffle(targets, rnd).map(make)] }
    }
    case 'facts':
      return { practice: 1, trials: [{ task, a: 1, b: 1, op: 'add', answer: 2 }, ...factTrials(band, rnd)] }
  }
}

// ───────────── Scoring ─────────────

export interface TrialResult {
  ok: boolean
  ms: number
  /** Number line only: distance from the right spot, as a share of the line (0–1). */
  error?: number
}

export interface TaskScore {
  n: number
  ok: number
  /** Median answer time in ms (correct answers; all of them if none was correct). */
  ms: number
  /** Number line: average error as a percentage of the line. */
  pae?: number
}

export interface ScreenResult {
  /** Which mission this belongs to, the day it was done and the track the child was on. */
  id: string
  day: string
  band: Band
  tasks: Record<TaskId, TaskScore>
}

export const median = (values: number[]): number => {
  if (!values.length) return 0
  const s = [...values].sort((a, b) => a - b)
  const mid = s.length >> 1
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/** A number-line answer counts as "on target" within a tenth of the line. */
export const LINE_TOLERANCE = 0.1

export function scoreTask(task: TaskId, results: TrialResult[]): TaskScore {
  const right = results.filter((r) => r.ok)
  const score: TaskScore = {
    n: results.length,
    ok: right.length,
    ms: Math.round(median((right.length ? right : results).map((r) => r.ms))),
  }
  if (task === 'line') score.pae = Math.round((results.reduce((s, r) => s + (r.error ?? 0), 0) / Math.max(1, results.length)) * 1000) / 10
  return score
}

// ───────────── Reading a class ─────────────

export type Level = 'ok' | 'watch' | 'low'

export interface Reading {
  tasks: Partial<Record<TaskId, Level>>
  /** True when the foundations of number look clearly weaker than the rest of the group. */
  observe: boolean
}

/** Fewer pupils than this and "compared with the class" means nothing. */
export const MIN_GROUP = 6

/** How many robust standard deviations a value sits on the worse side of the group's median. */
function behind(value: number, all: number[], higherIsBetter: boolean, floor: number): number {
  const m = median(all)
  const spread = Math.max(1.4826 * median(all.map((v) => Math.abs(v - m))), floor)
  return (higherIsBetter ? m - value : value - m) / spread
}

/**
 * Compares each pupil with their own class, task by task, on accuracy and on speed. No norms are
 * involved: "low" only ever means "clearly behind this group". Returns null for groups too small
 * to compare.
 */
export function readClass(results: Record<string, ScreenResult>): Record<string, Reading> | null {
  const ids = Object.keys(results)
  if (ids.length < MIN_GROUP) return null
  const out: Record<string, Reading> = Object.fromEntries(ids.map((id) => [id, { tasks: {}, observe: false }]))
  for (const task of TASKS) {
    const acc = (id: string) => (task === 'line' ? 1 - (results[id].tasks[task].pae ?? 0) / 100 : results[id].tasks[task].ok / Math.max(1, results[id].tasks[task].n))
    const time = (id: string) => results[id].tasks[task].ms
    const accs = ids.map(acc)
    const times = ids.map(time)
    const typicalTime = median(times)
    for (const id of ids) {
      // Guards keep tiny differences in a strong group from being read as a problem.
      const a = acc(id) < 0.85 ? behind(acc(id), accs, true, 0.05) : 0
      const t = task !== 'line' && time(id) > typicalTime * 1.3 ? behind(time(id), times, false, typicalTime * 0.15) : 0
      const worst = Math.max(a, t)
      out[id].tasks[task] = worst >= 2 ? 'low' : worst >= 1.25 ? 'watch' : 'ok'
    }
  }
  for (const id of ids) {
    const core = CORE_TASKS.map((t) => out[id].tasks[t])
    out[id].observe = core.filter((l) => l !== 'ok').length >= 2 && core.includes('low')
  }
  return out
}
