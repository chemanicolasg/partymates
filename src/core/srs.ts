import type { FactResult } from './types'

/** Leitner-box memory for one number fact. */
export interface FactMemory {
  box: number
  due: number
  ok: number
  ko: number
}
export type Memory = Record<string, FactMemory>

const DAY = 24 * 60 * 60 * 1000
/** Review gap after reaching each box: same session, then 1, 2, 4, 7 and 15 days. */
export const INTERVALS = [0, 1, 2, 4, 7, 15].map((d) => d * DAY)
export const MAX_BOX = INTERVALS.length - 1
/** From this box up we consider the fact memorised. */
export const MASTERED_BOX = 3

export const isDue = (m: FactMemory, now = Date.now()) => m.box < MAX_BOX && m.due <= now

/** A right answer climbs one box; a slip goes back to the start so the fact returns soon. */
export function review(memory: Memory, results: FactResult[], now = Date.now()): Memory {
  const next = { ...memory }
  for (const r of results) {
    const prev = next[r.key] ?? { box: 0, due: now, ok: 0, ko: 0 }
    const box = r.correct ? Math.min(MAX_BOX, prev.box + 1) : 0
    next[r.key] = {
      box,
      due: now + INTERVALS[box],
      ok: prev.ok + (r.correct ? 1 : 0),
      ko: prev.ko + (r.correct ? 0 : 1),
    }
  }
  return next
}

export function memoryStats(memory: Memory, now = Date.now()) {
  const all = Object.entries(memory)
  return {
    seen: all.length,
    mastered: all.filter(([, m]) => m.box >= MASTERED_BOX).length,
    due: all.filter(([, m]) => isDue(m, now) && m.ko > 0).length,
    /** Facts that keep slipping, hardest first. */
    weak: all
      .filter(([, m]) => m.ko > 0 && m.box < MASTERED_BOX)
      .sort((a, b) => b[1].ko - b[1].ok - (a[1].ko - a[1].ok))
      .map(([key]) => key),
  }
}
