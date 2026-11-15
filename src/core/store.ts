import { useSyncExternalStore } from 'react'
import { setSoundEnabled } from './audio'
import { getBackend, type Member } from './backend'
import { DOJO, DOJO_START, levelKey } from './curriculum'
import { ITEM_BY_ID, itemValue } from './items'
import { dayKey, dojoPassed, rewardsFor, weekStart, type Rewards } from './scoring'
import { review, type Memory } from './srs'
import { LEVELS_PER_WORLD, WORLDS, type Band, type FactResult, type GameResult, type Lang, type WorldId } from './types'

export interface LevelRecord {
  stars: number
  plays: number
}

export interface Profile {
  id: string
  /** Device-only secret that proves ownership of this player's row in a cloud class. */
  secret: string
  name: string
  skin: string
  color: string
  pet: string | null
  band: Band
  coins: number
  xp: number
  levels: Record<string, LevelRecord>
  facts: Memory
  dojo: { step: number; streak: number; lastDay: string; best: Record<string, number> }
  owned: string[]
  stats: {
    playMs: number
    byWorld: Record<WorldId, { ok: number; total: number }>
    /** XP earned per day (kept for the weekly class ranking and the grown-ups report). */
    days: Record<string, number>
  }
  classCode: string | null
  teamId: string | null
  createdAt: number
}

export interface AppState {
  v: 1
  lang: Lang
  sound: boolean
  profiles: Profile[]
  activeId: string | null
}

const KEY = 'partymates.v1'
const LANGS: Lang[] = ['ca', 'es', 'en']

function detectLang(): Lang {
  const prefs = typeof navigator !== 'undefined' ? (navigator.languages ?? [navigator.language]) : []
  for (const p of prefs) {
    const l = p.slice(0, 2).toLowerCase() as Lang
    if (LANGS.includes(l)) return l
  }
  return 'ca'
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as AppState
      if (s.v === 1 && Array.isArray(s.profiles)) return s
    }
  } catch {
    /* corrupted or unavailable storage: start fresh */
  }
  return { v: 1, lang: detectLang(), sound: true, profiles: [], activeId: null }
}

let state: AppState = load()
setSoundEnabled(state.sound)
const listeners = new Set<() => void>()

function set(next: AppState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* private mode or full disk: keep playing in memory */
  }
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const getState = () => state
export function useApp<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state))
}
export const activeProfile = (s: AppState = state) => s.profiles.find((p) => p.id === s.activeId) ?? null
/** For screens that only render with a player selected. */
export function useProfile(): Profile {
  const p = useApp((s) => activeProfile(s))
  if (!p) throw new Error('No active profile')
  return p
}

function patchProfile(id: string, fn: (p: Profile) => Profile) {
  set({ ...state, profiles: state.profiles.map((p) => (p.id === id ? fn(p) : p)) })
}

// ───────────── Derived values ─────────────

export const totalStars = (p: Profile) => Object.values(p.levels).reduce((s, l) => s + l.stars, 0)
export const levelStars = (p: Profile, world: WorldId, index: number) =>
  p.levels[levelKey(world, p.band, index)]?.stars ?? 0
export const worldStars = (p: Profile, world: WorldId) =>
  Array.from({ length: LEVELS_PER_WORLD }, (_, i) => levelStars(p, world, i)).reduce((a, b) => a + b, 0)
/** Levels open one after another; any star on the previous level is enough to move on. */
export const isUnlocked = (p: Profile, world: WorldId, index: number) => index === 0 || levelStars(p, world, index - 1) > 0
export function weekXp(p: Profile, now = Date.now()): number {
  const start = weekStart(now)
  return Object.entries(p.stats.days).reduce((s, [day, xp]) => (day >= start ? s + xp : s), 0)
}

// ───────────── Settings & profiles ─────────────

export const setLang = (lang: Lang) => set({ ...state, lang })
export const setSound = (sound: boolean) => {
  setSoundEnabled(sound)
  set({ ...state, sound })
}

export function createProfile(name: string, skin: string, color: string, band: Band): Profile {
  const p: Profile = {
    id: crypto.randomUUID(),
    secret: crypto.randomUUID(),
    name: name.trim().slice(0, 14),
    skin,
    color,
    pet: null,
    band,
    coins: 0,
    xp: 0,
    levels: {},
    facts: {},
    dojo: { step: DOJO_START[band], streak: 0, lastDay: '', best: {} },
    owned: [skin, color],
    stats: {
      playMs: 0,
      byWorld: Object.fromEntries(WORLDS.map((w) => [w, { ok: 0, total: 0 }])) as Profile['stats']['byWorld'],
      days: {},
    },
    classCode: null,
    teamId: null,
    createdAt: Date.now(),
  }
  set({ ...state, profiles: [...state.profiles, p], activeId: p.id })
  return p
}

export const selectProfile = (id: string | null) => set({ ...state, activeId: id })

export function deleteProfile(id: string) {
  const p = state.profiles.find((x) => x.id === id)
  if (p?.classCode) void getBackend().then((b) => b.leaveClass(p.classCode!, p.id, p.secret).catch(() => {}))
  set({ ...state, profiles: state.profiles.filter((x) => x.id !== id), activeId: state.activeId === id ? null : state.activeId })
}

/** A grown-up can move a child to an easier or harder track; stars of each track are kept. */
export function setBand(id: string, band: Band) {
  patchProfile(id, (p) => ({ ...p, band, dojo: { ...p.dojo, step: Math.max(p.dojo.step, DOJO_START[band]) } }))
}

// ───────────── Playing ─────────────

function addDay(days: Record<string, number>, xp: number): Record<string, number> {
  const today = dayKey()
  const next = { ...days, [today]: (days[today] ?? 0) + xp }
  // Keep two months of history at most.
  const keys = Object.keys(next).sort()
  for (const k of keys.slice(0, Math.max(0, keys.length - 60))) delete next[k]
  return next
}

export function finishLevel(world: WorldId, index: number, result: GameResult): Rewards & { previous: number } {
  const p = activeProfile()
  if (!p) throw new Error('No active profile')
  const key = levelKey(world, p.band, index)
  const previous = p.levels[key]?.stars ?? 0
  const rewards = rewardsFor(result, previous)
  patchProfile(p.id, (cur) => ({
    ...cur,
    coins: cur.coins + rewards.coins,
    xp: cur.xp + rewards.xp,
    levels: { ...cur.levels, [key]: { stars: Math.max(previous, rewards.stars), plays: (cur.levels[key]?.plays ?? 0) + 1 } },
    facts: review(cur.facts, result.facts),
    stats: {
      playMs: cur.stats.playMs + result.ms,
      byWorld: {
        ...cur.stats.byWorld,
        [world]: {
          ok: cur.stats.byWorld[world].ok + result.correct,
          total: cur.stats.byWorld[world].total + result.total,
        },
      },
      days: addDay(cur.stats.days, rewards.xp),
    },
  }))
  void syncClass()
  return { ...rewards, previous }
}

export interface DojoOutcome {
  passed: boolean
  leveledUp: boolean
  coins: number
  xp: number
  streak: number
  sec: number
  correct: number
  total: number
}

export function finishDojo(results: FactResult[], ms: number): DojoOutcome {
  const p = activeProfile()
  if (!p) throw new Error('No active profile')
  const step = DOJO[p.dojo.step]
  const correct = results.filter((r) => r.correct).length
  const sec = Math.round(ms / 1000)
  const passed = dojoPassed(correct, results.length, sec, step.targetSec)
  const leveledUp = passed && p.dojo.step < DOJO.length - 1
  const today = dayKey()
  const yesterday = dayKey(Date.now() - 24 * 60 * 60 * 1000)
  const streak = p.dojo.lastDay === today ? p.dojo.streak : p.dojo.lastDay === yesterday ? p.dojo.streak + 1 : 1
  const coins = correct * 2 + (passed ? 15 : 0) + (p.dojo.lastDay === today ? 0 : Math.min(streak, 7) * 2)
  const xp = correct * 8 + (passed ? 30 : 0)
  const best = p.dojo.best[step.id]
  patchProfile(p.id, (cur) => ({
    ...cur,
    coins: cur.coins + coins,
    xp: cur.xp + xp,
    facts: review(cur.facts, results),
    dojo: {
      step: leveledUp ? cur.dojo.step + 1 : cur.dojo.step,
      streak,
      lastDay: today,
      best: correct === results.length && (best === undefined || sec < best) ? { ...cur.dojo.best, [step.id]: sec } : cur.dojo.best,
    },
    stats: { ...cur.stats, playMs: cur.stats.playMs + ms, days: addDay(cur.stats.days, xp) },
  }))
  void syncClass()
  return { passed, leveledUp, coins, xp, streak, sec, correct, total: results.length }
}

// ───────────── Shop ─────────────

export function buyItem(itemId: string): boolean {
  const p = activeProfile()
  const item = ITEM_BY_ID[itemId]
  if (!p || !item || p.owned.includes(itemId) || p.coins < item.price) return false
  patchProfile(p.id, (cur) => ({ ...cur, coins: cur.coins - item.price, owned: [...cur.owned, itemId] }))
  equipItem(itemId)
  return true
}

export function equipItem(itemId: string | null, type?: 'pet') {
  const p = activeProfile()
  if (!p) return
  if (itemId === null) {
    if (type === 'pet') patchProfile(p.id, (cur) => ({ ...cur, pet: null }))
  } else {
    const item = ITEM_BY_ID[itemId]
    if (!item || !p.owned.includes(itemId)) return
    patchProfile(p.id, (cur) => ({ ...cur, [item.type]: itemId }))
  }
  void syncClass()
}

// ───────────── Class ─────────────

export function memberOf(p: Profile): Omit<Member, 'updatedAt'> {
  return {
    id: p.id,
    name: p.name,
    skin: itemValue(p.skin, '🦊'),
    color: itemValue(p.color, '#ffd23f'),
    pet: p.pet ? itemValue(p.pet) : null,
    stars: totalStars(p),
    xp: p.xp,
    weekXp: weekXp(p),
    week: weekStart(),
    teamId: p.teamId,
  }
}

/** Pushes the active player's scores to their class. Failures are silent: the game never blocks on the network. */
export async function syncClass(): Promise<void> {
  const p = activeProfile()
  if (!p?.classCode) return
  try {
    const backend = await getBackend()
    await backend.upsertMember(p.classCode, memberOf(p), p.secret)
  } catch {
    /* offline: the next sync will catch up */
  }
}

export async function joinClass(code: string): Promise<boolean> {
  const p = activeProfile()
  if (!p) return false
  const backend = await getBackend()
  const room = await backend.getClass(code)
  if (!room) return false
  await backend.upsertMember(code, { ...memberOf(p), teamId: null }, p.secret)
  patchProfile(p.id, (cur) => ({ ...cur, classCode: code, teamId: null }))
  return true
}

export async function leaveClass(): Promise<void> {
  const p = activeProfile()
  if (!p?.classCode) return
  const backend = await getBackend()
  await backend.leaveClass(p.classCode, p.id, p.secret).catch(() => {})
  patchProfile(p.id, (cur) => ({ ...cur, classCode: null, teamId: null }))
}

export async function setTeam(teamId: string | null): Promise<void> {
  const p = activeProfile()
  if (!p?.classCode) return
  patchProfile(p.id, (cur) => ({ ...cur, teamId }))
  await syncClass()
}
