import { add, arena, bay, blocks, calc, div, frac, groups, mul, pairs, party, pct, R, share, signed, stones, sub } from './curriculum'
import type { FactSpec, LevelCfg } from './types'

/** Something a teacher can set as the theme of the week. */
export interface Topic {
  id: string
  area: 'numbers' | 'add' | 'sub' | 'mul' | 'div' | 'fractions'
  /** Different activities on the same idea: homework rotates through them. */
  activities: LevelCfg[]
}

/**
 * A fact-based topic becomes three different activities: word problems on the keypad (with the
 * notepad at hand), matching pairs, and the arena without real time pressure.
 */
const facts = (...specs: FactSpec[]): LevelCfg[] => [bay([calc(...specs)], 6), pairs(specs, 5, 2), arena(specs, 5, 240, 8)]

const noCarry = (a: number, b: number) => (a % 10) + (b % 10) <= 9 && a + b <= 99
const carry = (a: number, b: number) => (a % 10) + (b % 10) >= 10 && a + b <= 99
const noBorrow = (a: number, b: number) => a % 10 >= b % 10 && a - b >= 10
const borrow = (a: number, b: number) => a % 10 < b % 10

export const TOPICS: Topic[] = [
  { id: 'n20', area: 'numbers', activities: [blocks([10, 1], 10, 20, { preview: true }), stones(1, 20, 5), party(0, 20, [R(1, 6)], ['sum'], 6)] },
  { id: 'n100', area: 'numbers', activities: [blocks([10, 1], 20, 99), stones(1, 100, 5), blocks([10, 1], 20, 100, { partial: true, step: 10 })] },
  { id: 'n1000', area: 'numbers', activities: [blocks([100, 10, 1], 100, 999), stones(100, 999, 6), stones(100, 999, 6, { desc: true })] },
  { id: 'ndec', area: 'numbers', activities: [blocks([100, 10, 1], 101, 999, { unit: 'dec', den: 100 }), stones(1, 99, 5, { unit: 'dec', den: 10 }), stones(1, 399, 6, { unit: 'dec', den: 100 })] },
  { id: 'nneg', area: 'numbers', activities: [stones(-20, 20, 6), party(-20, 20, [signed(1, 6), signed(1, 6)], ['sum']), stones(-100, 100, 6, { desc: true })] },

  { id: 'add10', area: 'add', activities: facts(add(R(1, 9), R(1, 9), (a, b) => a + b <= 10)) },
  { id: 'add20', area: 'add', activities: facts(add(R(3, 9), R(3, 9), (a, b) => a + b > 10)) },
  { id: 'add2d', area: 'add', activities: facts(add(R(11, 78), R(11, 78), noCarry)) },
  { id: 'addCarry', area: 'add', activities: facts(add(R(15, 78), R(13, 68), carry)) },

  { id: 'sub10', area: 'sub', activities: facts(sub(R(2, 10), R(1, 9))) },
  { id: 'sub20', area: 'sub', activities: facts(sub(R(11, 18), R(3, 9), (a, b) => a - b < 10)) },
  { id: 'sub2d', area: 'sub', activities: facts(sub(R(25, 99), R(11, 78), noBorrow)) },
  { id: 'subBorrow', area: 'sub', activities: facts(sub(R(21, 95), R(12, 78), borrow)) },

  { id: 'x2510', area: 'mul', activities: facts(mul([2, 5, 10], R(1, 10))) },
  { id: 'x34', area: 'mul', activities: facts(mul([3, 4], R(2, 10))) },
  { id: 'x67', area: 'mul', activities: facts(mul([6, 7], R(2, 10))) },
  { id: 'x89', area: 'mul', activities: facts(mul([8, 9], R(2, 10))) },
  { id: 'xAll', area: 'mul', activities: facts(mul(R(2, 9), R(2, 9))) },

  { id: 'd2510', area: 'div', activities: [bay([share([2, 5, 10], 2, 10)]), ...facts(div([2, 5, 10], R(2, 10))).slice(1)] },
  { id: 'dAll', area: 'div', activities: [bay([share(R(3, 9), 2, 10), groups(R(3, 9), 2, 10)]), ...facts(div(R(3, 9), R(2, 10))).slice(1)] },
  { id: 'dRem', area: 'div', activities: [bay([share([2, 3, 4, 5], 2, 6, { concrete: true, rem: true })]), bay([share(R(2, 9), 2, 9, { rem: true })])] },

  { id: 'fBuild', area: 'fractions', activities: [blocks([4, 2, 1], 1, 7, { unit: 'frac', den: 4 }), blocks([8, 4, 2, 1], 3, 15, { unit: 'frac', den: 8 }), stones(1, 11, 5, { unit: 'frac', den: 12 })] },
  { id: 'fOf', area: 'fractions', activities: [bay([frac([[1, 2], [1, 4], [1, 3], [1, 5]], 2, 10)]), bay([frac([[2, 3], [3, 4], [2, 5], [3, 5]], 2, 10)])] },
  { id: 'pct', area: 'fractions', activities: [bay([pct([50, 25, 10], [20, 40, 60, 80, 100, 200])]), blocks([50, 25, 10, 5, 1], 15, 100, { unit: 'pct', step: 5 }), bay([pct([20, 75, 5, 30], [20, 40, 60, 80, 100, 200])])] },
]

export const TOPIC_BY_ID: Record<string, Topic> = Object.fromEntries(TOPICS.map((t) => [t.id, t]))
export const AREAS: Topic['area'][] = ['numbers', 'add', 'sub', 'mul', 'div', 'fractions']
