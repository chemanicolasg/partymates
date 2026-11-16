import { AREAS, TOPIC_BY_ID, TOPICS, type Topic } from './topics'
import { ZONES, type ZoneId } from './types'

/** The settings a world can be dressed in: the four zones of the journey plus the seasonal ones. */
export type SceneId = ZoneId | 'halloween' | 'xmas'
export const SCENES: SceneId[] = [...ZONES, 'halloween', 'xmas']

/** A question with its answer, as short texts. */
export type QA = [q: string, a: string]

/** One stop of a world: a ready-made theme, or exercises written by the teacher. */
export type WorldStop = { t: 'topic'; topic: string } | { t: 'own'; items: QA[] }

/** A short trail of stops somebody put together: a teacher for the class, or us for a season. */
export interface World {
  id: string
  name: string
  scene: SceneId
  stops: WorldStop[]
}

export const MAX_STOPS = 8
export const MIN_ITEMS = 3
export const MAX_ITEMS = 12
const MAX_Q = 70
const MAX_A = 18

// ───────────── Reading what the teacher types ─────────────

const NUM = /^[+-]?\d+(?:\.\d+)?$/
/** Unifies the many ways of typing an operation: 3x4, 3*4, 12:4, 2,5 + 1… */
const tidy = (s: string) =>
  s
    .replace(/[−–—]/g, '-')
    .replace(/[×xX*·]/g, '×')
    .replace(/[÷:/]/g, '÷')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/\s+/g, '')

/**
 * Value of an arithmetic expression (+ − × ÷ and brackets), or null when it is not one.
 * A tiny parser instead of `eval`: what the teacher types is only ever read as numbers and signs.
 */
export function evalExpr(raw: string): number | null {
  const s = tidy(raw)
  if (!s || !/^[\d.+\-×÷()]+$/.test(s)) return null
  let i = 0
  const number = (): number | null => {
    const m = /^\d+(?:\.\d+)?/.exec(s.slice(i))
    if (!m) return null
    i += m[0].length
    return Number(m[0])
  }
  const factor = (): number | null => {
    if (s[i] === '-') {
      i++
      const v = factor()
      return v === null ? null : -v
    }
    if (s[i] === '(') {
      i++
      const v = sum()
      if (v === null || s[i] !== ')') return null
      i++
      return v
    }
    return number()
  }
  const product = (): number | null => {
    let v = factor()
    while (v !== null && (s[i] === '×' || s[i] === '÷')) {
      const op = s[i++]
      const r = factor()
      if (r === null || (op === '÷' && r === 0)) return null
      v = op === '×' ? v * r : v / r
    }
    return v
  }
  function sum(): number | null {
    let v = product()
    while (v !== null && (s[i] === '+' || s[i] === '-')) {
      const op = s[i++]
      const r = product()
      if (r === null) return null
      v = op === '+' ? v + r : v - r
    }
    return v
  }
  const v = sum()
  return v !== null && i === s.length && Number.isFinite(v) ? v : null
}

/** Rounds away floating-point dust; null when the value needs more than two decimals. */
function exact(v: number): number | null {
  const r = Math.round(v * 100) / 100
  return Math.abs(r - v) < 1e-9 ? r : null
}

const show = (v: number) => String(v).replace('-', '−').replace('.', ',')
/** How an operation is shown to the child: proper signs, spaces around them, decimal comma. */
const pretty = (raw: string) =>
  tidy(raw)
    .replace(/\./g, ',')
    .replace(/([+×÷=])/g, ' $1 ')
    .replace(/([\d)?])-/g, '$1 − ')
    .replace(/-/g, '−')
    .trim()

/** Number hidden behind the "?" of `3 × ? = 12`, or null when there is not exactly one sensible value. */
function solveBlank(left: string, right: string): number | null {
  const at = (x: number) => {
    const fill = (side: string) => evalExpr(side.replace('?', `(${x})`))
    const [l, r] = [fill(left), fill(right)]
    return l === null || r === null ? null : l - r
  }
  // Most blanks are linear in the unknown: two samples give the answer.
  const [f0, f1] = [at(0), at(1)]
  if (f0 !== null && f1 !== null && f1 !== f0) {
    const x = exact(-f0 / (f1 - f0))
    if (x !== null && Math.abs(at(x) ?? 1) < 1e-9) return x
  }
  // "12 ÷ ? = 3" is not: look through the whole numbers.
  for (let x = 1; x <= 1000; x++) if (Math.abs(at(x) ?? 1) < 1e-9) return x
  return null
}

export type LineError = 'syntax' | 'inexact' | 'long' | 'answer'
export interface ParsedLine {
  line: number
  text: string
  item?: QA
  error?: LineError
}

/**
 * One exercise per line. Three ways of writing them:
 *   `23 + 48`            the app works out the answer
 *   `3 × ? = 12`         the app finds the missing number
 *   `Sides of a hexagon = 6`   any question, with its answer after the last "="
 */
export function parseExercises(text: string): ParsedLine[] {
  const out: ParsedLine[] = []
  text.split('\n').forEach((raw, n) => {
    const line = raw.trim().replace(/^[-•*]\s+/, '').replace(/^\d+[.)]\s+/, '')
    if (!line) return
    const entry: ParsedLine = { line: n + 1, text: line }
    out.push(entry)
    const blanked = line.replace(/_+|□|\?/g, '?')
    const eq = blanked.lastIndexOf('=')
    const [left, right] = eq < 0 ? [blanked, ''] : [blanked.slice(0, eq).trim(), blanked.slice(eq + 1).trim()]
    const arithmetic = (s: string) => /^[\d.,+\-−–×xX*·÷:/()?\s]+$/.test(s) && /\d/.test(s)

    let item: QA | null = null
    if (eq < 0) {
      // Just an operation.
      const v = evalExpr(left)
      if (v === null) return void (entry.error = 'syntax')
      const r = exact(v)
      if (r === null) return void (entry.error = 'inexact')
      item = [pretty(left), show(r)]
    } else if (arithmetic(left) && (right === '' || right === '?' || arithmetic(right))) {
      const blanks = (blanked.match(/\?/g) ?? []).length
      if (right === '' || (right === '?' && blanks === 1)) {
        // "23 + 48 =" and "23 + 48 = ?" are the plain operation again.
        const v = evalExpr(left)
        if (v === null) return void (entry.error = 'syntax')
        const r = exact(v)
        if (r === null) return void (entry.error = 'inexact')
        item = [pretty(left), show(r)]
      } else if (blanks === 1) {
        const x = solveBlank(tidy(left), tidy(right))
        if (x === null) return void (entry.error = 'syntax')
        item = [`${pretty(left)} = ${pretty(right)}`, show(x)]
      } else if (blanks === 0) {
        // Both sides given: the teacher wrote the answer herself. Keep hers only if it is right.
        const [l, r] = [evalExpr(left), evalExpr(right)]
        if (l === null || r === null) return void (entry.error = 'syntax')
        if (Math.abs(l - r) > 1e-9) return void (entry.error = 'answer')
        const v = exact(r)
        if (v === null) return void (entry.error = 'inexact')
        item = [pretty(left), show(v)]
      } else return void (entry.error = 'syntax')
    } else {
      // Free question = answer.
      if (!left || !right) return void (entry.error = 'answer')
      const n2 = NUM.test(tidy(right)) ? exact(Number(tidy(right))) : null
      item = [left.replace(/\s+/g, ' '), n2 !== null ? show(n2) : right.replace(/\s+/g, ' ')]
    }
    if (item[0].length > MAX_Q || item[1].length > MAX_A) return void (entry.error = 'long')
    entry.item = item
  })
  return out
}

/** Back to the text a teacher would type, to edit a stop again. */
export const exercisesText = (items: QA[]) =>
  items
    .map(([q, a]) => {
      const again = parseExercises(q)[0]?.item
      return again && again[0] === q && again[1] === a ? q : `${q} = ${a}`
    })
    .join('\n')

// ───────────── Answering ─────────────

/** The number an answer stands for, or null when it is a word. */
export function answerValue(a: string): number | null {
  const s = tidy(a)
  return NUM.test(s) ? Number(s) : null
}

/** Whole, non-negative answers are typed on the keypad; anything else is picked among options. */
export const isTyped = (a: string) => /^\d{1,6}$/.test(a)

export function isRight(expected: string, given: string): boolean {
  const [e, g] = [answerValue(expected), answerValue(given)]
  if (e !== null) return g !== null && Math.abs(e - g) < 1e-9
  return expected.trim().toLocaleLowerCase() === given.trim().toLocaleLowerCase()
}

/** Three options for an answer that cannot be typed: near misses for numbers, other answers for words. */
export function optionsFor(item: QA, all: QA[], rnd: () => number = Math.random): string[] {
  const [, a] = item
  const v = answerValue(a)
  const wrong: string[] = []
  const add = (s: string) => {
    if (wrong.length < 2 && !isRight(a, s) && !wrong.some((w) => isRight(w, s))) wrong.push(s)
  }
  const shuffle = <T,>(xs: T[]) => xs.map((x) => [rnd(), x] as const).sort((p, q) => p[0] - q[0]).map(([, x]) => x)
  if (v !== null) {
    const unit = 1 / 10 ** (a.split(',')[1] ?? '').length
    const near = shuffle([v + unit, v - unit, v + 10 * unit, v - 10 * unit, -v]).concat([v * 10, v + 2 * unit, v + 3 * unit])
    // Children who answer with positive numbers are not shown negative ones.
    for (const n of near) if (n >= 0 || v < 0) add(show(Math.round(n * 100) / 100))
  } else {
    for (const [, other] of shuffle(all)) add(other)
  }
  return shuffle([a, ...wrong])
}

// ───────────── Checking a world ─────────────

/** A stop a child can actually play. */
export function stopProblem(stop: WorldStop): 'empty' | 'few' | 'options' | null {
  if (stop.t === 'topic') return TOPIC_BY_ID[stop.topic] ? null : 'empty'
  if (stop.items.length === 0) return 'empty'
  if (stop.items.length < MIN_ITEMS) return 'few'
  // Word answers are picked among the other answers of the stop: there must be enough of them.
  const words = stop.items.filter(([, a]) => answerValue(a) === null)
  const distinct = new Set(stop.items.map(([, a]) => a.toLocaleLowerCase()))
  return words.length && distinct.size < 3 ? 'options' : null
}

const isScene = (s: unknown): s is SceneId => SCENES.includes(s as SceneId)

/** Reads a world that came over the network: anything malformed is dropped rather than trusted. */
export function cleanWorld(raw: unknown): World | null {
  const w = raw as Partial<World> | null
  if (!w || typeof w.id !== 'string' || typeof w.name !== 'string' || !Array.isArray(w.stops)) return null
  const stops: WorldStop[] = []
  for (const s of w.stops.slice(0, MAX_STOPS) as WorldStop[]) {
    if (s?.t === 'topic' && typeof s.topic === 'string') stops.push({ t: 'topic', topic: s.topic })
    else if (s?.t === 'own' && Array.isArray(s.items)) {
      const items = s.items
        .filter((i): i is QA => Array.isArray(i) && typeof i[0] === 'string' && typeof i[1] === 'string')
        .slice(0, MAX_ITEMS)
        .map(([q, a]): QA => [q.slice(0, MAX_Q), a.slice(0, MAX_A)])
      stops.push({ t: 'own', items })
    }
  }
  const playable = stops.filter((s) => stopProblem(s) === null)
  if (!playable.length) return null
  return { id: w.id.slice(0, 40), name: w.name.slice(0, 40), scene: isScene(w.scene) ? w.scene : 'beach', stops: playable }
}

// ───────────── Ready-made worlds ─────────────

/** A starting point for the teacher: every theme of one area, in order. */
export const areaStops = (area: Topic['area']): WorldStop[] =>
  TOPICS.filter((t) => t.area === area).slice(0, MAX_STOPS).map((t) => ({ t: 'topic', topic: t.id }))
export const TEMPLATE_AREAS = AREAS
export const AREA_SCENE: Record<Topic['area'], SceneId> = { numbers: 'beach', add: 'beach', sub: 'jungle', mul: 'mountain', div: 'mountain', fractions: 'space' }

export const newWorldId = () => `w${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`
