import type {
  ArenaCfg,
  Band,
  BayCfg,
  BayTask,
  BlocksCfg,
  DojoStep,
  FactSpec,
  Kind,
  LevelCfg,
  PairsCfg,
  PartyCfg,
  Rule,
  StonesCfg,
  Unit,
  ZoneId,
} from './types'
import { ZONES } from './types'

/** Inclusive integer range. */
export const R = (lo: number, hi: number, step = 1): number[] => {
  const out: number[] = []
  for (let v = lo; v <= hi; v += step) out.push(v)
  return out
}
export const signed = (lo: number, hi: number) => [...R(lo, hi).map((v) => -v), ...R(lo, hi)]

// ───────────── Fact pools ─────────────

export const add = (as: number[], bs: number[], filter?: FactSpec['filter']): FactSpec => ({ op: 'add', as, bs, filter })
/** a − b, never negative. */
export const sub = (as: number[], bs: number[], filter?: FactSpec['filter']): FactSpec => ({
  op: 'sub',
  as,
  bs,
  filter: (a, b) => a > b && (!filter || filter(a, b)),
})
export const mul = (as: number[], bs: number[], filter?: FactSpec['filter']): FactSpec => ({ op: 'mul', as, bs, filter })
/** (a × b) ÷ a = b: `as` are the divisors (tables), `bs` the quotients. */
export const div = (as: number[], bs: number[]): FactSpec => ({ op: 'div', as, bs })

// ───────────── Block Valley ─────────────

export const blocks = (
  pieces: number[],
  min: number,
  max: number,
  o: Partial<Pick<BlocksCfg, 'unit' | 'den' | 'step' | 'partial' | 'preview' | 'rounds'>> = {},
): BlocksCfg => ({
  kind: 'blocks',
  unit: (o.unit ?? 'int') as Unit,
  den: o.den ?? 1,
  pieces,
  min,
  max,
  step: o.step ?? 1,
  partial: o.partial ?? false,
  preview: o.preview ?? false,
  rounds: o.rounds ?? 6,
})

const BLOCKS: Record<Band, BlocksCfg[]> = {
  A: [
    blocks([1], 1, 5, { preview: true, rounds: 5 }),
    blocks([1], 3, 10, { preview: true, rounds: 5 }),
    blocks([5, 1], 4, 10, { preview: true, rounds: 5 }),
    blocks([10, 1], 10, 20, { preview: true }),
    blocks([1], 10, 10, { partial: true }),
    blocks([10, 1], 11, 30),
    blocks([10, 1], 20, 59),
    blocks([10, 1], 30, 99),
  ],
  B: [
    blocks([10, 1], 20, 60, { preview: true }),
    blocks([10, 1], 40, 99),
    blocks([10, 1], 20, 100, { partial: true, step: 10 }),
    blocks([100, 10, 1], 100, 250),
    blocks([100, 10, 1], 200, 600),
    blocks([100, 10, 1], 400, 999),
    blocks([10, 1], 30, 100, { partial: true }),
    blocks([100, 10, 1], 200, 1000, { partial: true, step: 100 }),
  ],
  C: [
    blocks([100, 10, 1], 300, 999),
    blocks([1000, 100, 10, 1], 1000, 4000),
    blocks([1000, 100, 10, 1], 3000, 9999),
    blocks([100, 10, 1], 1000, 1000, { partial: true }),
    blocks([10, 1], 11, 59, { unit: 'dec', den: 10 }),
    blocks([100, 10, 1], 101, 399, { unit: 'dec', den: 100 }),
    blocks([10, 1], 20, 50, { unit: 'dec', den: 10, partial: true, step: 10 }),
    blocks([100, 10, 1], 100, 300, { unit: 'dec', den: 100, partial: true, step: 100 }),
  ],
  D: [
    blocks([100, 10, 1], 201, 999, { unit: 'dec', den: 100 }),
    blocks([4, 2, 1], 1, 7, { unit: 'frac', den: 4 }),
    blocks([8, 4, 2, 1], 3, 23, { unit: 'frac', den: 8 }),
    blocks([6, 3, 2, 1], 1, 17, { unit: 'frac', den: 6 }),
    blocks([12, 6, 4, 3, 1], 5, 23, { unit: 'frac', den: 12 }),
    blocks([50, 25, 10, 5, 1], 15, 100, { unit: 'pct', step: 5 }),
    blocks([8, 4, 2, 1], 8, 16, { unit: 'frac', den: 8, partial: true, step: 8 }),
    blocks([100, 10, 1], 100, 1000, { unit: 'dec', den: 100, partial: true, step: 100 }),
  ],
}

// ───────────── Party Island ─────────────

export const party = (min: number, max: number, dice: number[][], rules: Rule[], rounds = 8): PartyCfg => ({
  kind: 'party',
  min,
  max,
  dice,
  rules,
  rounds,
})
const d6 = R(1, 6)

const PARTY: Record<Band, PartyCfg[]> = {
  A: [
    party(0, 10, [[1, 2, 3]], ['sum'], 6),
    party(0, 20, [d6], ['sum'], 6),
    party(0, 20, [[1, 2, 3], [1, 2, 3]], ['sum'], 6),
    party(0, 30, [d6, d6], ['sum']),
    party(0, 20, [R(1, 4)], ['back']),
    party(0, 30, [d6], ['back']),
    party(0, 30, [d6, [1, 2, 3]], ['sum', 'back']),
    party(0, 30, [d6, d6], ['sum', 'back']),
  ],
  B: [
    party(0, 100, [d6, d6], ['sum']),
    party(0, 100, [[10, 20, 30], d6], ['sum']),
    party(0, 100, [d6, d6], ['back']),
    party(0, 100, [d6, d6, d6], ['sum']),
    party(0, 100, [R(5, 15)], ['double']),
    party(0, 100, [[2, 5, 10], R(1, 5)], ['prod']),
    party(0, 100, [[10, 20], R(1, 9)], ['back']),
    party(0, 100, [[10, 20, 30], R(1, 9)], ['sum', 'back']),
  ],
  C: [
    party(0, 300, [R(2, 5), R(2, 9)], ['prod']),
    party(0, 500, [R(6, 9), R(2, 9)], ['prod']),
    party(0, 500, [R(10, 40, 10), R(1, 9)], ['back']),
    party(0, 300, [R(2, 6), R(2, 6), R(1, 9)], ['prodPlus']),
    party(0, 1000, [R(10, 50, 10), R(2, 9)], ['prod']),
    party(0, 500, [R(6, 9), R(6, 9), R(1, 9)], ['prodMinus']),
    party(0, 500, [d6, d6, R(2, 5)], ['sumTimes']),
    party(0, 500, [R(2, 9), R(2, 9), R(1, 9)], ['prod', 'prodPlus', 'prodMinus']),
  ],
  D: [
    party(-20, 20, [signed(1, 6)], ['sum']),
    party(-20, 20, [signed(1, 6), signed(1, 6)], ['sum']),
    party(-30, 30, [signed(1, 9)], ['back']),
    party(0, 500, [R(1, 9), R(1, 9), R(2, 9)], ['sumTimes']),
    party(0, 500, [R(2, 12)], ['square']),
    party(-50, 50, [signed(1, 5), R(2, 6)], ['prod']),
    party(0, 1000, [[11, 12, 15, 20, 25], R(2, 9), R(10, 50, 10)], ['prodPlus']),
    party(-50, 50, [signed(1, 6), signed(1, 5)], ['sum', 'back', 'prod']),
  ],
}

// ───────────── Storm Arena ─────────────

export const arena = (specs: FactSpec[], hand: number, seconds: number, rounds = 10): ArenaCfg => ({
  kind: 'arena',
  specs,
  hand,
  seconds,
  rounds,
})

const aA = {
  to5: add(R(1, 4), R(1, 4), (a, b) => a + b <= 5),
  to10: add(R(1, 9), R(1, 9), (a, b) => a + b <= 10),
  sub10: sub(R(2, 10), R(1, 9)),
  bonds: add(R(1, 9), R(1, 9), (a, b) => a + b === 10),
  teen: add(R(10, 15), R(1, 5), (a, b) => (a % 10) + b <= 9),
  cross: add(R(5, 9), R(3, 9), (a, b) => a + b > 10),
  sub20: sub(R(11, 20), R(1, 9)),
}
const aB = {
  add20: add(R(2, 9), R(2, 9), (a, b) => a + b >= 8),
  sub20: sub(R(11, 20), R(2, 9)),
  x2x10: mul([2, 10], R(1, 10)),
  x5: mul([5], R(1, 10)),
  x3x4: mul([3, 4], R(1, 10)),
  add2d: add(R(11, 59), R(2, 9)),
  div: div([2, 5, 10], R(1, 10)),
}
const aC = {
  x2to5: mul(R(2, 5), R(2, 10)),
  x67: mul([6, 7], R(2, 10)),
  x89: mul([8, 9], R(2, 10)),
  xAll: mul(R(2, 9), R(2, 9)),
  d2to5: div(R(2, 5), R(2, 10)),
  d6to9: div(R(6, 9), R(2, 10)),
  x1112: mul([11, 12], R(2, 12)),
  xTens: mul(R(20, 50, 10), R(2, 9)),
}
const aD = {
  xHard: mul(R(6, 9), R(6, 9)),
  dAll: div(R(6, 12), R(2, 12)),
  xTens: mul(R(20, 90, 10), R(20, 90, 10)),
  xHundreds: mul([200, 300, 400], R(2, 9)),
  squares: mul(R(2, 15), R(2, 15), (a, b) => a === b),
  x11to15: mul(R(11, 15), R(2, 9)),
  to100: add(R(11, 89), R(11, 89), (a, b) => a + b === 100),
  xDec: mul([0.5, 1.5, 2.5, 0.2, 0.1], R(2, 10)),
  dBig: div([11, 12, 15, 20, 25], R(2, 9)),
}

const ARENA: Record<Band, ArenaCfg[]> = {
  A: [
    arena([aA.to5], 4, 150, 8),
    arena([aA.to10], 5, 150, 8),
    arena([aA.sub10], 5, 150, 8),
    arena([aA.bonds], 6, 150, 8),
    arena([aA.teen], 5, 150, 8),
    arena([aA.cross], 5, 150, 8),
    arena([aA.sub20], 5, 150, 8),
    arena([aA.to10, aA.sub10, aA.cross, aA.sub20], 6, 150),
  ],
  B: [
    arena([aB.add20], 5, 120),
    arena([aB.sub20], 5, 120),
    arena([aB.x2x10], 5, 120),
    arena([aB.x5], 5, 120),
    arena([aB.x3x4], 6, 120),
    arena([aB.add2d], 5, 120),
    arena([aB.div], 6, 120),
    arena([aB.add20, aB.sub20, aB.x2x10, aB.x5, aB.x3x4, aB.div], 6, 120),
  ],
  C: [
    arena([aC.x2to5], 6, 100),
    arena([aC.x67], 6, 100),
    arena([aC.x89], 6, 100),
    arena([aC.xAll], 6, 100),
    arena([aC.d2to5], 6, 100),
    arena([aC.d6to9], 6, 100),
    arena([aC.x1112, aC.xTens], 6, 110),
    arena([aC.x67, aC.x89, aC.d6to9], 6, 100),
  ],
  D: [
    arena([aD.xHard], 6, 75),
    arena([aD.dAll], 6, 90),
    arena([aD.xTens, aD.xHundreds], 6, 100),
    arena([aD.squares, aD.x11to15], 6, 100),
    arena([aD.to100], 6, 100),
    arena([aD.xDec], 6, 100),
    arena([aD.dBig], 6, 100),
    arena([aD.xHard, aD.dAll, aD.squares, aD.to100], 6, 90),
  ],
}

// ───────────── Treasure Bay ─────────────

export const bay = (tasks: BayTask[], rounds = 6): BayCfg => ({ kind: 'bay', tasks, rounds })
export const share = (ks: number[], lo: number, hi: number, o: { concrete?: boolean; rem?: boolean } = {}): BayTask => ({
  t: 'share',
  ks,
  q: [lo, hi],
  ...o,
})
export const groups = (ss: number[], lo: number, hi: number): BayTask => ({ t: 'groups', ss, n: [lo, hi] })
export const frac = (fracs: [number, number][], lo: number, hi: number): BayTask => ({ t: 'frac', fracs, q: [lo, hi] })
export const pct = (pcts: number[], bases: number[]): BayTask => ({ t: 'pct', pcts, bases })
export const ratio = (ratios: [number, number][], lo: number, hi: number): BayTask => ({ t: 'ratio', ratios, q: [lo, hi] })
export const calc = (...specs: FactSpec[]): BayTask => ({ t: 'calc', specs })

const bB = {
  s2510: share([2, 5, 10], 2, 10),
  s34: share([3, 4], 2, 10),
  g: groups([2, 3, 4, 5, 10], 2, 10),
  f: frac([[1, 2], [1, 4]], 2, 10),
  r: share([2, 3, 4, 5, 10], 2, 9, { rem: true }),
}
const bC = {
  rem: share(R(3, 9), 3, 10, { rem: true }),
  f1: frac([[2, 3], [3, 4], [2, 5], [3, 5], [5, 6]], 2, 10),
  big: share([2, 3, 4, 5], 11, 25),
  f2: frac([[3, 8], [5, 8], [7, 10], [3, 10], [4, 5]], 2, 12),
}
const bD = {
  f: frac([[3, 4], [2, 3], [5, 6], [3, 8], [7, 10], [4, 9]], 3, 12),
  p2: pct([20, 75, 5, 30], [20, 40, 60, 80, 100, 200, 300]),
  big: share([3, 4, 6, 7, 8, 9], 12, 40),
  r2: ratio([[3, 2], [4, 1], [5, 3], [2, 3], [3, 4]], 2, 12),
}

const BAY: Record<Band, BayCfg[]> = {
  A: [
    bay([share([2], 1, 5, { concrete: true })], 5),
    bay([share([2], 3, 10, { concrete: true })], 5),
    bay([share([3], 1, 5, { concrete: true })], 5),
    bay([share([2, 3], 2, 6, { concrete: true })], 5),
    bay([groups([2], 1, 5)], 5),
    bay([share([4, 5], 1, 4, { concrete: true })], 5),
    bay([groups([2, 5], 1, 5)], 5),
    bay([share([2, 3, 4, 5], 1, 5, { concrete: true })]),
  ],
  B: [
    bay([share([2, 5], 2, 6, { concrete: true })]),
    bay([bB.s2510]),
    bay([bB.s34]),
    bay([bB.g]),
    bay([bB.f]),
    bay([share([2, 3, 4, 5], 2, 6, { concrete: true, rem: true })]),
    bay([bB.r]),
    bay([bB.s2510, bB.s34, bB.g, bB.f, bB.r, calc(aB.add2d, aB.sub20)], 8),
  ],
  C: [
    bay([share(R(6, 9), 2, 10)]),
    bay([bC.rem]),
    bay([frac([[1, 3], [1, 5], [1, 6], [1, 8], [1, 10]], 2, 10)]),
    bay([bC.f1]),
    bay([bC.big]),
    bay([groups([6, 7, 8, 9, 12], 2, 10)]),
    bay([bC.f2]),
    bay([bC.rem, bC.f1, bC.big, bC.f2, calc(aC.xAll, aC.xTens)], 8),
  ],
  D: [
    bay([bD.f]),
    bay([pct([50, 25, 10], [20, 40, 60, 80, 100, 120, 200])]),
    bay([bD.p2]),
    bay([ratio([[1, 1], [2, 1], [3, 1], [1, 2]], 2, 10)]),
    bay([bD.big]),
    bay([pct([15, 35, 60, 90, 12], [20, 40, 60, 80, 100, 200, 300, 500])]),
    bay([bD.r2]),
    bay([bD.f, bD.p2, bD.big, bD.r2], 8),
  ],
}

// ───────────── Stepping stones ─────────────

export const stones = (
  min: number,
  max: number,
  count: number,
  o: Partial<Pick<StonesCfg, 'unit' | 'den' | 'desc' | 'specs' | 'rounds'>> = {},
): StonesCfg => ({
  kind: 'stones',
  unit: o.unit ?? 'int',
  den: o.den ?? 1,
  min,
  max,
  count,
  desc: o.desc ?? false,
  specs: o.specs,
  rounds: o.rounds ?? 5,
})

/** One level per zone of the journey. */
const STONES: Record<Band, StonesCfg[]> = {
  A: [stones(1, 10, 4), stones(1, 20, 5), stones(1, 50, 5), stones(10, 99, 5, { desc: true })],
  B: [
    stones(1, 100, 5),
    stones(100, 999, 5),
    stones(0, 0, 5, { specs: [add(R(2, 9), R(2, 9))] }),
    stones(100, 999, 6, { desc: true }),
  ],
  C: [
    stones(1000, 9999, 5),
    stones(0, 0, 5, { specs: [mul(R(2, 9), R(2, 9))] }),
    stones(1, 99, 5, { unit: 'dec', den: 10 }),
    stones(1, 399, 6, { unit: 'dec', den: 100 }),
  ],
  D: [
    stones(-20, 20, 6),
    stones(1, 999, 6, { unit: 'dec', den: 100, desc: true }),
    stones(1, 23, 5, { unit: 'frac', den: 12 }),
    stones(-100, 100, 6, { desc: true }),
  ],
}

// ───────────── Pairs ─────────────

export const pairs = (specs: FactSpec[], n = 5, boards = 2): PairsCfg => ({ kind: 'pairs', specs, pairs: n, boards })

const PAIRS: Record<Band, PairsCfg[]> = {
  A: [pairs([aA.to10], 4), pairs([aA.sub10], 4), pairs([aA.teen]), pairs([aA.cross, aA.sub20])],
  B: [pairs([aB.add20]), pairs([aB.x2x10, aB.x5]), pairs([aB.x3x4]), pairs([aB.div])],
  C: [pairs([aC.x2to5]), pairs([aC.x67, aC.x89]), pairs([aC.d2to5, aC.d6to9]), pairs([aC.x1112], 6)],
  D: [pairs([aD.xHard], 6), pairs([aD.dAll], 6), pairs([aD.squares, aD.x11to15], 6), pairs([aD.dBig], 6)],
}

const LEVELS: Record<Kind, Record<Band, LevelCfg[]>> = {
  blocks: BLOCKS,
  party: PARTY,
  arena: ARENA,
  bay: BAY,
  stones: STONES,
  pairs: PAIRS,
}

export function getLevel(kind: Kind, band: Band, index: number): LevelCfg {
  return LEVELS[kind][band][index]
}

/** Also the key under which stars are saved, so it must stay stable. */
export const levelKey = (kind: Kind, band: Band, index: number) => `${kind}-${band}-${index}`

// ───────────── The journey ─────────────

export interface Stop {
  /** Position along the whole journey, 0-based. */
  index: number
  zone: ZoneId
  kind: Kind
  /** Level of that kind's ladder. */
  level: number
  boss: boolean
}

export const STOPS_PER_ZONE = 10

/**
 * Every zone mixes all the activities so no two stops in a row feel the same; each zone takes the
 * next step up every activity's ladder, and ends on a timed arena challenge.
 */
export const JOURNEY: Stop[] = ZONES.flatMap((zone, z) => {
  const order: [Kind, number][] = [
    ['blocks', 2 * z],
    ['party', 2 * z],
    ['stones', z],
    ['arena', 2 * z],
    ['bay', 2 * z],
    ['pairs', z],
    ['blocks', 2 * z + 1],
    ['party', 2 * z + 1],
    ['bay', 2 * z + 1],
    ['arena', 2 * z + 1],
  ]
  return order.map(([kind, level], i) => ({
    index: z * STOPS_PER_ZONE + i,
    zone,
    kind,
    level,
    boss: i === STOPS_PER_ZONE - 1,
  }))
})

/** Facts for the surprise events of a zone: the same ones its arena levels practise. */
export function eventSpecs(band: Band, zone: ZoneId): FactSpec[] {
  const z = ZONES.indexOf(zone)
  return [ARENA[band][2 * z], ARENA[band][2 * z + 1]].flatMap((cfg) => cfg.specs)
}

// ───────────── Lightning Gym (daily fluency ladder, Kumon style) ─────────────

export const DOJO_SHEET = 12

const step = (id: string, label: string, targetSec: number, ...specs: FactSpec[]): DojoStep => ({ id, label, specs, targetSec })

export const DOJO: DojoStep[] = [
  step('add1', '+1', 60, add(R(1, 9), [1])),
  step('add2', '+2', 60, add(R(1, 8), [2])),
  step('add3', '+3', 60, add(R(1, 7), [3])),
  step('add10', '4 + 5', 55, add(R(1, 9), R(1, 9), (a, b) => a + b <= 10)),
  step('sub10', '9 − 4', 55, sub(R(2, 10), R(1, 9))),
  step('bonds10', '▢ + ▢ = 10', 50, add(R(1, 9), R(1, 9), (a, b) => a + b === 10)),
  step('add20', '8 + 7', 55, add(R(2, 9), R(2, 9), (a, b) => a + b > 10)),
  step('sub20', '15 − 8', 60, sub(R(11, 18), R(2, 9), (a, b) => a - b < 10)),
  step('x2', '×2', 45, mul([2], R(1, 10))),
  step('x5', '×5', 45, mul([5], R(1, 10))),
  step('x10', '×10', 40, mul([10], R(1, 10))),
  step('x3', '×3', 50, mul([3], R(2, 10))),
  step('x4', '×4', 50, mul([4], R(2, 10))),
  step('x6', '×6', 50, mul([6], R(2, 10))),
  step('x7', '×7', 50, mul([7], R(2, 10))),
  step('x8', '×8', 50, mul([8], R(2, 10))),
  step('x9', '×9', 50, mul([9], R(2, 10))),
  step('xmix', '× 2–9', 45, mul(R(2, 9), R(2, 9))),
  step('div25', '÷ 2–5', 50, div(R(2, 5), R(2, 10))),
  step('div69', '÷ 6–9', 50, div(R(6, 9), R(2, 10))),
  step('divmix', '÷ 2–9', 45, div(R(2, 9), R(2, 9))),
  step('add2d', '25 + 7', 60, add(R(12, 89), R(3, 9))),
  step('sub2d', '25 − 7', 65, sub(R(21, 99), R(3, 9))),
  step('x1112', '×11 · ×12', 55, mul([11, 12], R(2, 12))),
  step('squares', 'n × n', 55, mul(R(2, 15), R(2, 15), (a, b) => a === b)),
  step('to100', '▢ + ▢ = 100', 70, add(R(11, 89), R(11, 89), (a, b) => a + b === 100)),
]

/** Where each age group starts on the fluency ladder. */
export const DOJO_START: Record<Band, number> = { A: 0, B: 6, C: 8, D: 17 }
