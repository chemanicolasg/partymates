import type { MemberReport } from './backend'
import { KINDS, type Kind } from './types'

/**
 * What a teacher's panel shows about a class, worked out from what each pupil's device reports.
 * Kept free of any screen code so it can be tested on its own.
 */

/** The routine recommended to families and schools: a few short sessions spread over the week. */
export const PLAN = { days: 4, minutes: 15 }

/** Answers needed in an activity before its percentage says anything. */
const MIN_ANSWERS = 10

export interface SkillLine {
  kind: Kind
  /** Percentage right, or null with too few answers to tell. */
  pct: number | null
  answers: number
}

export interface PupilLine {
  m: MemberReport
  /** Played in the week being looked at. */
  active: boolean
  weekMin: number
  days: number
  onPlan: boolean
  totalMin: number
  accuracy: number | null
  skills: SkillLine[]
  strongest: Kind | null
  weakest: Kind | null
}

const skillsOf = (byKind: Record<string, { ok: number; total: number }> | undefined): SkillLine[] =>
  KINDS.map((kind) => {
    const k = byKind?.[kind]
    const answers = k?.total ?? 0
    return { kind, answers, pct: answers >= MIN_ANSWERS ? Math.round(((k?.ok ?? 0) / answers) * 100) : null }
  })

/** The best and the worst of the activities with enough answers — only when they really differ. */
function extremes(skills: SkillLine[]): { strongest: Kind | null; weakest: Kind | null } {
  const known = skills.filter((s) => s.pct !== null).sort((a, b) => (b.pct as number) - (a.pct as number))
  if (known.length < 2 || (known[0].pct as number) - (known[known.length - 1].pct as number) < 8) return { strongest: null, weakest: null }
  return { strongest: known[0].kind, weakest: known[known.length - 1].kind }
}

export function pupilLine(m: MemberReport, week: string): PupilLine {
  const fresh = m.stats?.week === week
  const weekMin = fresh ? (m.stats.weekMin ?? 0) : 0
  const days = fresh ? (m.stats.days ?? (weekMin > 0 ? 1 : 0)) : 0
  const totals = Object.values(m.stats?.byKind ?? {}).reduce((s, k) => ({ ok: s.ok + k.ok, total: s.total + k.total }), { ok: 0, total: 0 })
  const skills = skillsOf(m.stats?.byKind)
  return {
    m,
    active: weekMin > 0,
    weekMin,
    days,
    onPlan: days >= PLAN.days,
    // Devices that have not sent the total yet have played at least this week's minutes.
    totalMin: Math.max(m.stats?.totalMin ?? 0, weekMin),
    accuracy: totals.total >= MIN_ANSWERS ? Math.round((totals.ok / totals.total) * 100) : null,
    skills,
    ...extremes(skills),
  }
}

export interface ClassKpis {
  pupils: number
  active: number
  onPlan: number
  /** Average minutes this week among those who played. */
  minutes: number
  accuracy: number | null
  skills: SkillLine[]
  strongest: Kind | null
  weakest: Kind | null
  /** Number facts several pupils keep missing, most common first. */
  hard: [key: string, pupils: number][]
  /** The class week by week, oldest first. */
  series: { week: string; min: number; active: number }[]
}

export function classKpis(members: MemberReport[], week: string): ClassKpis {
  const lines = members.map((m) => pupilLine(m, week))
  const active = lines.filter((l) => l.active)
  const sum: Record<string, { ok: number; total: number }> = {}
  for (const m of members)
    for (const [kind, k] of Object.entries(m.stats?.byKind ?? {})) sum[kind] = { ok: (sum[kind]?.ok ?? 0) + k.ok, total: (sum[kind]?.total ?? 0) + k.total }
  const all = Object.values(sum).reduce((s, k) => ({ ok: s.ok + k.ok, total: s.total + k.total }), { ok: 0, total: 0 })
  const skills = skillsOf(sum)

  const counts = new Map<string, number>()
  for (const m of members) for (const key of m.stats?.weak ?? []) counts.set(key, (counts.get(key) ?? 0) + 1)

  const weeks = new Map<string, { min: number; active: number }>()
  for (const m of members)
    for (const w of m.weeks ?? []) {
      const cur = weeks.get(w.week) ?? { min: 0, active: 0 }
      weeks.set(w.week, { min: cur.min + w.min, active: cur.active + (w.min > 0 ? 1 : 0) })
    }

  return {
    pupils: members.length,
    active: active.length,
    onPlan: lines.filter((l) => l.onPlan).length,
    minutes: active.length ? Math.round(active.reduce((s, l) => s + l.weekMin, 0) / active.length) : 0,
    accuracy: all.total >= MIN_ANSWERS ? Math.round((all.ok / all.total) * 100) : null,
    skills,
    ...extremes(skills),
    hard: [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8),
    series: [...weeks.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-8).map(([w, v]) => ({ week: w, ...v })),
  }
}

/** Minutes as a teacher reads them: "45 min", "2 h 05". */
export const fmtMinutes = (min: number) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`)

const cell = (v: string | number) => {
  // Spreadsheets run cells that start like a formula: such text is kept as text.
  const s = String(v)
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return /[";\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/** The class as a spreadsheet (semicolon-separated, the way Excel in Spanish and Catalan expects). */
export function csvReport(
  members: MemberReport[],
  week: string,
  names: Record<string, string>,
  notes: Record<string, string>,
  head: string[],
  kindName: (k: Kind) => string,
): string {
  const rows = members.map((m) => {
    const l = pupilLine(m, week)
    return [
      m.num,
      names[m.num] || m.name,
      m.stars,
      l.weekMin,
      l.days,
      l.totalMin,
      l.accuracy ?? '',
      l.strongest ? kindName(l.strongest) : '',
      l.weakest ? kindName(l.weakest) : '',
      (m.stats?.weak ?? []).join(' '),
      new Date(m.updatedAt).toISOString().slice(0, 10),
      notes[m.num] ?? '',
    ]
  })
  return [head, ...rows].map((r) => r.map(cell).join(';')).join('\r\n')
}

/** The link (and QR code) that takes a child straight into the class with their list number. */
export const joinLink = (origin: string, code: string, num?: number) => `${origin}/?clase=${code}${num ? `&n=${num}` : ''}`

/** The link (and QR code) that connects a child's game to their family. */
export const familyLink = (origin: string, code: string) => `${origin}/?familia=${code}`

/** Reads a join link's query. Null unless it carries a well-formed class code. */
export function readJoinLink(search: string): { code: string; num: number | null } | null {
  const q = new URLSearchParams(search)
  const code = (q.get('clase') ?? '').toUpperCase()
  if (!/^[A-Z0-9]{6}$/.test(code)) return null
  const n = Number(q.get('n'))
  return { code, num: Number.isInteger(n) && n >= 1 && n <= 99 ? n : null }
}
