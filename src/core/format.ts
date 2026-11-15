import type { Lang, Op, Unit } from './types'

export const OP_SYMBOL: Record<Op, string> = { add: '+', sub: '−', mul: '×', div: '÷' }

/** Numbers the way children see them at school: decimal comma in Catalan and Spanish, a real minus sign. */
export function fmtNum(v: number, lang: Lang, decimals?: number): string {
  const abs = Math.abs(v)
  let s = decimals !== undefined ? abs.toFixed(decimals) : String(Math.round(abs * 100) / 100)
  if (lang !== 'en') s = s.replace('.', ',')
  return (v < 0 ? '−' : '') + s
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)

export function fracParts(v: number, den: number) {
  const whole = Math.floor(v / den)
  const rest = v - whole * den
  const g = gcd(rest, den) || 1
  return { whole, num: rest / g, den: den / g }
}

/** Plain-text quantity (labels, aria). Use <Qty> for the pretty stacked fraction. */
export function fmtQty(v: number, unit: Unit, den: number, lang: Lang): string {
  if (unit === 'int') return fmtNum(v, lang)
  if (unit === 'pct') return `${fmtNum(v, lang)} %`
  if (unit === 'dec') return fmtNum(v / den, lang, den >= 100 ? 2 : 1)
  const f = fracParts(v, den)
  if (!f.num) return String(f.whole)
  return (f.whole ? `${f.whole} ` : '') + `${f.num}/${f.den}`
}

/** "6x7" → "6 × 7 = 42" for reports. */
export function factLabel(key: string, lang: Lang): string {
  const m = key.match(/^(-?[\d.]+)([+\-x/])(-?[\d.]+)$/)
  if (!m) return key
  const a = Number(m[1])
  const b = Number(m[3])
  const op: Op = m[2] === '+' ? 'add' : m[2] === '-' ? 'sub' : m[2] === 'x' ? 'mul' : 'div'
  const res = op === 'add' ? a + b : op === 'sub' ? a - b : op === 'mul' ? a * b : a / b
  return `${fmtNum(a, lang)} ${OP_SYMBOL[op]} ${fmtNum(b, lang)} = ${fmtNum(Math.round(res * 100) / 100, lang)}`
}
