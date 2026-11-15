import { DOJO_SHEET } from './curriculum'
import { isDue, type Memory } from './srs'
import type { ArenaCfg, BayCfg, BayTask, BlocksCfg, DojoStep, Fact, FactSpec, Op, PairsCfg, PartyCfg, Rule, StonesCfg } from './types'

export type Rnd = () => number

export const int = (lo: number, hi: number, rnd: Rnd = Math.random) => lo + Math.floor(rnd() * (hi - lo + 1))
export const pick = <T>(arr: readonly T[], rnd: Rnd = Math.random): T => arr[Math.floor(rnd() * arr.length)]
export function shuffle<T>(arr: readonly T[], rnd: Rnd = Math.random): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
/** Keeps decimal facts (0.5 × 3) free of floating point dust. */
export const round2 = (v: number) => Math.round(v * 100) / 100

// ───────────── Facts ─────────────

/** Builds a fact from a spec pair. For division the pair is (divisor, quotient). */
export function makeFact(op: Op, a: number, b: number): Fact {
  switch (op) {
    case 'add':
      return { op, a, b, answer: round2(a + b), key: `${Math.min(a, b)}+${Math.max(a, b)}` }
    case 'sub':
      return { op, a, b, answer: round2(a - b), key: `${a}-${b}` }
    case 'mul':
      return { op, a, b, answer: round2(a * b), key: `${Math.min(a, b)}x${Math.max(a, b)}` }
    case 'div': {
      const dividend = round2(a * b)
      return { op, a: dividend, b: a, answer: b, key: `${dividend}/${a}` }
    }
  }
}

const poolCache = new WeakMap<FactSpec, Fact[]>()

export function factPool(spec: FactSpec): Fact[] {
  let pool = poolCache.get(spec)
  if (!pool) {
    const seen = new Set<string>()
    pool = []
    for (const a of spec.as)
      for (const b of spec.bs) {
        if (spec.filter && !spec.filter(a, b)) continue
        const f = makeFact(spec.op, a, b)
        // Keep both orders of commutative facts (3+4 and 4+3 look different on cards) but one per pair.
        const id = `${f.key}|${a}|${b}`
        if (!seen.has(id)) {
          seen.add(id)
          pool.push(f)
        }
      }
    poolCache.set(spec, pool)
  }
  return pool
}

/**
 * Picks the next fact. Facts the child got wrong and that are due for review come back first
 * (spaced repetition); `avoid` keeps one game from repeating itself.
 */
export function genFact(
  specs: FactSpec[],
  memory: Memory | undefined,
  rnd: Rnd = Math.random,
  avoid?: Set<string>,
  now = Date.now(),
): Fact {
  const spec = pick(specs, rnd)
  const pool = factPool(spec)
  if (memory && rnd() < 0.4) {
    const due = pool.filter((f) => !avoid?.has(f.key) && memory[f.key] && isDue(memory[f.key], now))
    if (due.length) return pick(due, rnd)
  }
  const fresh = avoid ? pool.filter((f) => !avoid.has(f.key)) : pool
  return pick(fresh.length ? fresh : pool, rnd)
}

// ───────────── Block Valley ─────────────

export interface BlocksRound {
  target: number
  start: number
}

export function genBlocksRound(cfg: BlocksCfg, rnd: Rnd = Math.random, avoid?: Set<number>): BlocksRound {
  const lo = Math.ceil(cfg.min / cfg.step)
  const hi = Math.floor(cfg.max / cfg.step)
  let target = int(lo, hi, rnd) * cfg.step
  for (let i = 0; i < 12 && avoid?.has(target) && hi > lo; i++) target = int(lo, hi, rnd) * cfg.step
  if (!cfg.partial) return { target, start: 0 }
  // Missing-part problems: start somewhere along the bridge, never at the very end.
  let start = int(Math.max(1, Math.floor(target / 10)), target - 1, rnd)
  for (let i = 0; i < 12 && avoid?.has(start) && target > 2; i++)
    start = int(Math.max(1, Math.floor(target / 10)), target - 1, rnd)
  return { target, start }
}

/** Fewest pieces that make `amount` (used for the "swap ten ones for a ten" tip). */
export function minPieces(amount: number, pieces: number[]): number {
  const best = new Array<number>(amount + 1).fill(Infinity)
  best[0] = 0
  for (let v = 1; v <= amount; v++)
    for (const p of pieces) if (p <= v && best[v - p] + 1 < best[v]) best[v] = best[v - p] + 1
  return best[amount]
}

// ───────────── Party Island ─────────────

export interface PartyRound {
  /** Where the turn starts (after a warp, if the dice could not fit on the track). */
  pos: number
  warped: boolean
  rule: Rule
  dice: number[]
  move: number
  dest: number
  /** Landing spots to choose from; null when the whole board is shown. */
  options: number[] | null
  fact?: Fact
}

const ARITY: Partial<Record<Rule, number>> = { prod: 2, double: 1, square: 1 }

export function moveFor(rule: Rule, d: number[]): number {
  const sum = d.reduce((s, v) => s + v, 0)
  switch (rule) {
    case 'sum':
      return sum
    case 'back':
      return -sum
    case 'prod':
      return d[0] * d[1]
    case 'prodPlus':
      return d[0] * d[1] + d[2]
    case 'prodMinus':
      return d[0] * d[1] - d[2]
    case 'sumTimes':
      return (d[0] + d[1]) * d[2]
    case 'double':
      return 2 * d[0]
    case 'square':
      return d[0] * d[0]
  }
}

/** Typical slips (wrong order of operations, adding instead of multiplying…) make the best distractors. */
function slips(rule: Rule, d: number[]): number[] {
  const sum = d.reduce((s, v) => s + v, 0)
  switch (rule) {
    case 'prod':
      return [d[0] + d[1]]
    case 'prodPlus':
      return [d[0] * (d[1] + d[2]), sum]
    case 'prodMinus':
      return [d[0] * (d[1] - d[2]), d[0] * d[1] + d[2]]
    case 'sumTimes':
      return [d[0] + d[1] * d[2], sum]
    case 'double':
      return [d[0] + 2, d[0]]
    case 'square':
      return [2 * d[0]]
    default:
      return []
  }
}

export const isFullBoard = (cfg: PartyCfg) => cfg.max - cfg.min <= 30

export function partyStart(cfg: PartyCfg, rnd: Rnd = Math.random): number {
  const span = cfg.max - cfg.min
  const jitter = span > 30 ? int(0, Math.floor(span / 5), rnd) : 0
  const onlyBack = cfg.rules.every((r) => r === 'back')
  const hasNeg = cfg.dice.some((f) => f.some((v) => v < 0))
  if (hasNeg || (cfg.rules.includes('back') && !onlyBack)) return Math.round((cfg.min + cfg.max) / 2)
  return onlyBack ? cfg.max - jitter : cfg.min + jitter
}

export function genPartyRound(cfg: PartyCfg, pos: number, rnd: Rnd = Math.random): PartyRound {
  let from = pos
  let warped = false
  for (let attempt = 0; attempt < 400; attempt++) {
    if (attempt > 0 && attempt % 8 === 0) {
      // The dice cannot fit from here: a whirlpool carries the player elsewhere on the track.
      from = int(cfg.min, cfg.max, rnd)
      warped = true
    }
    const rule = pick(cfg.rules, rnd)
    const dice = cfg.dice.slice(0, ARITY[rule] ?? cfg.dice.length).map((faces) => pick(faces, rnd))
    const move = moveFor(rule, dice)
    const dest = from + move
    if (move === 0 || dest < cfg.min || dest > cfg.max) continue
    return {
      pos: from,
      warped,
      rule,
      dice,
      move,
      dest,
      options: isFullBoard(cfg) ? null : partyOptions(cfg, from, rule, dice, dest, rnd),
      fact: partyFact(rule, dice),
    }
  }
  throw new Error('Party level cannot produce a valid move')
}

function partyOptions(cfg: PartyCfg, pos: number, rule: Rule, dice: number[], dest: number, rnd: Rnd): number[] {
  const move = dest - pos
  const smart = [...slips(rule, dice).map((m) => pos + m), pos - move, dest + 10, dest - 10]
  const near = [dest + 1, dest - 1, dest + 2, dest - 2, dest + 5, dest - 5, dest + 3, dest - 3, dest + 20, dest - 20]
  const out = new Set<number>([dest])
  for (const v of [...shuffle(smart, rnd).slice(0, 3), ...shuffle(near, rnd)]) {
    if (out.size >= 6) break
    if (v >= cfg.min && v <= cfg.max && v !== pos) out.add(v)
  }
  for (let v = cfg.min; out.size < 6 && v <= cfg.max; v++) if (v !== pos) out.add(v)
  return [...out].sort((a, b) => a - b)
}

function partyFact(rule: Rule, d: number[]): Fact | undefined {
  const basic = d.every((v) => Number.isInteger(v) && v >= 1 && v <= 15)
  if (!basic) return undefined
  if (rule === 'sum' && d.length === 2) return makeFact('add', d[0], d[1])
  if (rule === 'prod') return makeFact('mul', d[0], d[1])
  if (rule === 'double') return makeFact('mul', 2, d[0])
  if (rule === 'square') return makeFact('mul', d[0], d[0])
  return undefined
}

// ───────────── Storm Arena ─────────────

export interface ArenaRound {
  fact: Fact
  op: Op
  target: number
  cards: number[]
}

/** Result of fusing two cards; order never matters to the player. NaN when the fusion is impossible. */
export function fuse(op: Op, x: number, y: number): number {
  const hi = Math.max(x, y)
  const lo = Math.min(x, y)
  switch (op) {
    case 'add':
      return round2(x + y)
    case 'mul':
      return round2(x * y)
    case 'sub':
      return round2(hi - lo)
    case 'div':
      return lo !== 0 && Number.isInteger(round2(hi / lo)) ? round2(hi / lo) : NaN
  }
}

export function genArenaRound(cfg: ArenaCfg, memory?: Memory, rnd: Rnd = Math.random, avoid?: Set<string>): ArenaRound {
  const fact = genFact(cfg.specs, memory, rnd, avoid)
  const spec = cfg.specs.find((s) => s.op === fact.op) ?? cfg.specs[0]
  const need = [fact.a, fact.b]
  const pool = new Set<number>([...spec.as, ...spec.bs])
  if (fact.op === 'div') for (const f of shuffle(factPool(spec), rnd).slice(0, 12)) pool.add(f.a)
  const extras = shuffle([...pool].filter((v) => !need.includes(v)), rnd).slice(0, cfg.hand - 2)
  for (let v = 1; extras.length < cfg.hand - 2; v++) {
    const cand = round2(fact.answer + v)
    if (!need.includes(cand) && !extras.includes(cand)) extras.push(cand)
  }
  return { fact, op: fact.op, target: fact.answer, cards: shuffle([...need, ...extras], rnd) }
}

// ───────────── Treasure Bay ─────────────

export interface BayRound {
  t: BayTask['t']
  total: number
  /** share: how many chests · groups: size of each group. */
  k: number
  /** frac: numerator/denominator · ratio: the two parts. */
  n: number
  d: number
  pct: number
  answer: number
  /** Leftover (share with remainder) or second part (ratio). */
  answer2?: number
  /** Concrete stage: the child deals the gems by hand instead of typing a number. */
  concrete: boolean
  /** Word problems: which operation the story is about. */
  op?: Op
  fact?: Fact
}

export function genBayRound(cfg: BayCfg, rnd: Rnd = Math.random, avoid?: Set<string>): BayRound {
  let round = bayOnce(cfg, rnd)
  for (let i = 0; i < 12 && avoid?.has(bayId(round)); i++) round = bayOnce(cfg, rnd)
  return round
}

export const bayId = (r: BayRound) => `${r.t}:${r.total}:${r.k}:${r.n}:${r.d}:${r.pct}`

function bayOnce(cfg: BayCfg, rnd: Rnd): BayRound {
  const task = pick(cfg.tasks, rnd)
  const base = { t: task.t, k: 0, n: 0, d: 0, pct: 0, concrete: false }
  switch (task.t) {
    case 'share': {
      const k = pick(task.ks, rnd)
      const q = int(task.q[0], task.q[1], rnd)
      const r = task.rem ? (rnd() < 0.15 ? 0 : int(1, k - 1, rnd)) : 0
      const total = k * q + r
      return {
        ...base,
        total,
        k,
        answer: q,
        answer2: task.rem ? r : undefined,
        concrete: !!task.concrete && total <= 30,
        fact: r === 0 && k <= 12 && q <= 12 ? makeFact('div', k, q) : undefined,
      }
    }
    case 'groups': {
      const s = pick(task.ss, rnd)
      const n = int(task.n[0], task.n[1], rnd)
      return { ...base, total: s * n, k: s, answer: n, fact: makeFact('div', s, n) }
    }
    case 'frac': {
      const [n, d] = pick(task.fracs, rnd)
      const q = int(task.q[0], task.q[1], rnd)
      return { ...base, total: d * q, n, d, answer: n * q }
    }
    case 'pct': {
      for (;;) {
        const p = pick(task.pcts, rnd)
        const total = pick(task.bases, rnd)
        if ((p * total) % 100 === 0) return { ...base, total, pct: p, answer: (p * total) / 100 }
      }
    }
    case 'calc': {
      const fact = genFact(task.specs, undefined, rnd)
      // The story always reads "first number, then second": total and k carry the two operands.
      return { ...base, total: fact.a, k: fact.b, answer: fact.answer, op: fact.op, fact }
    }
    case 'ratio': {
      const [a, b] = pick(task.ratios, rnd)
      const q = int(task.q[0], task.q[1], rnd)
      return { ...base, total: (a + b) * q, n: a, d: b, answer: a * q, answer2: b * q }
    }
  }
}

// ───────────── Stepping stones ─────────────

export interface Stone {
  /** What decides the order (in the level's internal units). */
  value: number
  /** Set when the stone shows an operation instead of a plain number. */
  fact?: Fact
}

/** A handful of stones with different values, in the scrambled order they appear on the river. */
export function genStonesRound(cfg: StonesCfg, rnd: Rnd = Math.random): Stone[] {
  const out: Stone[] = []
  const used = new Set<number>()
  if (cfg.specs) {
    const pool = shuffle(cfg.specs.flatMap((s) => factPool(s)), rnd)
    for (const fact of pool) {
      if (out.length >= cfg.count) break
      if (used.has(fact.answer)) continue
      used.add(fact.answer)
      out.push({ value: fact.answer, fact })
    }
    return out
  }
  for (let guard = 0; out.length < cfg.count && guard < 500; guard++) {
    const value = int(cfg.min, cfg.max, rnd)
    if (used.has(value)) continue
    used.add(value)
    out.push({ value })
  }
  return out
}

// ───────────── Pairs ─────────────

/** Facts for one board: every result is different, so each operation has exactly one partner. */
export function genPairsBoard(cfg: PairsCfg, memory?: Memory, rnd: Rnd = Math.random, avoid?: Set<string>, now = Date.now()): Fact[] {
  const pool = shuffle(cfg.specs.flatMap((s) => factPool(s)), rnd)
  // Facts due for review go first, then ones not seen in this game.
  const rank = (f: Fact) => (memory?.[f.key] && isDue(memory[f.key], now) ? 0 : avoid?.has(f.key) ? 2 : 1)
  const sorted = [...pool].sort((a, b) => rank(a) - rank(b))
  const out: Fact[] = []
  const answers = new Set<number>()
  const keys = new Set<string>()
  for (const f of sorted) {
    if (out.length >= cfg.pairs) break
    if (answers.has(f.answer) || keys.has(f.key)) continue
    answers.add(f.answer)
    keys.add(f.key)
    out.push(f)
  }
  return shuffle(out, rnd)
}

// ───────────── Surprise events ─────────────

export interface Choice {
  fact: Fact
  /** Three possible answers in random order, exactly one of them right. */
  options: number[]
}

/** A quick three-way question; the wrong options are the slips children really make. */
export function genChoice(specs: FactSpec[], memory?: Memory, rnd: Rnd = Math.random, avoid?: Set<string>): Choice {
  const fact = genFact(specs, memory, rnd, avoid)
  const { a, b, answer, op } = fact
  const slips = [
    answer + 1,
    answer - 1,
    answer + 10,
    answer - 10,
    answer + 2,
    op === 'mul' ? round2(a * (b + 1)) : answer + 5,
    op === 'mul' ? round2(a * (b - 1)) : answer - 2,
    op === 'mul' ? a + b : op === 'add' ? Math.abs(a - b) : op === 'sub' ? a + b : answer * 2,
  ].filter((v) => v !== answer && v >= 0)
  const wrong: number[] = []
  for (const v of shuffle(slips, rnd)) if (wrong.length < 2 && !wrong.includes(v)) wrong.push(v)
  for (let v = answer + 3; wrong.length < 2; v++) if (!wrong.includes(v)) wrong.push(v)
  return { fact, options: shuffle([answer, ...wrong], rnd) }
}

// ───────────── Lightning Gym ─────────────

export function genDojoSheet(step: DojoStep, memory?: Memory, rnd: Rnd = Math.random): Fact[] {
  const out: Fact[] = []
  const used = new Set<string>()
  const distinct = new Set(step.specs.flatMap((s) => factPool(s).map((f) => f.key))).size
  for (let i = 0; i < DOJO_SHEET; i++) {
    // Small tables run out of new facts: start over, but never repeat the fact just asked.
    if (used.size >= distinct) {
      used.clear()
      if (out.length && distinct > 1) used.add(out[out.length - 1].key)
    }
    const f = genFact(step.specs, memory, rnd, used)
    used.add(f.key)
    out.push(f)
  }
  return out
}
