export type Lang = 'ca' | 'es' | 'en'
export type Band = 'A' | 'B' | 'C' | 'D'
export type Op = 'add' | 'sub' | 'mul' | 'div'
export type WorldId = 'blocks' | 'party' | 'arena' | 'bay'

export const BANDS: Band[] = ['A', 'B', 'C', 'D']
export const WORLDS: WorldId[] = ['blocks', 'party', 'arena', 'bay']
export const LEVELS_PER_WORLD = 8

/** A basic number fact, the unit tracked by the spaced-repetition memory system. */
export interface Fact {
  op: Op
  a: number
  b: number
  answer: number
  key: string
}

export interface FactResult {
  key: string
  correct: boolean
  ms: number
}

/** What every mini-game reports back when it ends. */
export interface GameResult {
  correct: number
  total: number
  ms: number
  facts: FactResult[]
}

/** Pool of facts: every combination of `as` × `bs` that passes `filter`. */
export interface FactSpec {
  op: Op
  as: number[]
  bs: number[]
  filter?: (a: number, b: number) => boolean
}

// ───────────── Level configurations, one shape per world ─────────────

export type Unit = 'int' | 'dec' | 'frac' | 'pct'

/** Block Valley — compose a target quantity out of pieces (Montessori golden beads). */
export interface BlocksCfg {
  kind: 'blocks'
  unit: Unit
  /** Internal units per 1 whole (10 or 100 for decimals, the denominator for fractions). */
  den: number
  /** Piece sizes in internal units, largest first. */
  pieces: number[]
  min: number
  max: number
  /** Targets are multiples of this (internal units). */
  step: number
  /** Bridge is already started: the child finds the missing part. */
  partial: boolean
  /** Concrete stage: the bridge grows live while pieces are added. */
  preview: boolean
  rounds: number
}

export type Rule = 'sum' | 'back' | 'prod' | 'prodPlus' | 'prodMinus' | 'sumTimes' | 'double' | 'square'

/** Party Island — dice race on a number line. */
export interface PartyCfg {
  kind: 'party'
  min: number
  max: number
  dice: number[][]
  rules: Rule[]
  rounds: number
}

/** Storm Arena — fuse two energy cards to hit the shield exactly (fact fluency). */
export interface ArenaCfg {
  kind: 'arena'
  specs: FactSpec[]
  hand: number
  seconds: number
  rounds: number
}

export type BayTask =
  | { t: 'share'; ks: number[]; q: [number, number]; concrete?: boolean; rem?: boolean }
  | { t: 'groups'; ss: number[]; n: [number, number] }
  | { t: 'frac'; fracs: [number, number][]; q: [number, number] }
  | { t: 'pct'; pcts: number[]; bases: number[] }
  | { t: 'ratio'; ratios: [number, number][]; q: [number, number] }

/** Treasure Bay — fair sharing: division, fractions, percentages, ratios. */
export interface BayCfg {
  kind: 'bay'
  tasks: BayTask[]
  rounds: number
}

export type LevelCfg = BlocksCfg | PartyCfg | ArenaCfg | BayCfg

export interface DojoStep {
  id: string
  /** Language-free name of the sheet, e.g. "×7". */
  label: string
  specs: FactSpec[]
  /** Kumon-style standard completion time for the whole sheet, in seconds. */
  targetSec: number
}
