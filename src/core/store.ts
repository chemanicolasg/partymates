import { useSyncExternalStore } from 'react'
import { setSoundEnabled } from './audio'
import { getBackend, type ClassInfo, type Homework, type MemberStats, type MemberUpsert, type Screening } from './backend'
import { DOJO, DOJO_START, JOURNEY, levelKey, STOPS_PER_ZONE, type Stop } from './curriculum'
import { DEFAULT_LOOK, encodeLook, FREE_ITEMS, ITEM_BY_ID, itemName, LEGACY_SKINS, type ItemType, type Look } from './look'
import { setMusicEnabled } from './music'
import { dayKey, dojoPassed, rewardsFor, weekStart, type Rewards } from './scoring'
import type { ScreenResult, TaskId, TaskScore } from './screening'
import { memoryStats, review, type Memory } from './srs'
import type { Band, FactResult, GameResult, Lang, ZoneId } from './types'

export interface LevelRecord {
  stars: number
  plays: number
}

export interface Profile {
  id: string
  /** Device-only secret that proves ownership of this player's row in a cloud class. */
  secret: string
  name: string
  look: Look
  band: Band
  /** Points: earned by playing, spent on characters and outfits. */
  coins: number
  xp: number
  levels: Record<string, LevelRecord>
  facts: Memory
  dojo: { step: number; streak: number; lastDay: string; best: Record<string, number> }
  owned: string[]
  stats: {
    playMs: number
    byKind: Record<string, { ok: number; total: number }>
    /** XP and play time per day (the grown-ups and teacher reports show the current week). */
    days: Record<string, number>
    ms: Record<string, number>
  }
  classCode: string | null
  /** Class list number the child typed when joining. */
  classNum: number | null
  /** Last known state of the class, so the homework shows up without waiting for the network. */
  classInfo: ClassInfo | null
  /** Stars earned on the current homework. */
  hw: { id: string; stars: number; plays: number } | null
  /** Latest number-sense mission the child completed. */
  screen: ScreenResult | null
  /** Levels played since the last surprise event. */
  sinceEvent: number
  createdAt: number
}

/** A class this device manages as a teacher. Names never leave the device. */
export interface TeacherClass {
  code: string
  key: string
  name: string
  names: Record<string, string>
}

export interface AppState {
  v: 1
  lang: Lang
  sound: boolean
  music: boolean
  profiles: Profile[]
  activeId: string | null
  teacher: TeacherClass[]
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

/** Brings a profile saved by an earlier version up to date without losing stars or points. */
export function upgradeProfile(raw: Record<string, unknown>): Profile {
  const old = raw as unknown as Profile & { skin?: string; color?: string; pet?: string | null; stats: { byWorld?: Profile['stats']['byKind'] } }
  let { look, owned, coins } = old
  if (!look) {
    // First version: emoji characters. Keep the choice where a drawn equivalent exists, refund the rest.
    const legacy = (id?: string | null) => (id ? id.slice(id.indexOf(':') + 1) : '')
    const mapped = LEGACY_SKINS[legacy(old.skin)] ?? {}
    look = { ...DEFAULT_LOOK, ...mapped, pet: legacy(old.pet) || null, bg: ITEM_BY_ID[`bg:${legacy(old.color)}`] ? legacy(old.color) : 'sun' }
    const next = new Set<string>(FREE_ITEMS)
    for (const id of old.owned ?? []) {
      const m = id.startsWith('skin:') ? LEGACY_SKINS[legacy(id)] : null
      if (m) for (const [type, name] of Object.entries(m)) next.add(`${type}:${name}`)
      else if (id.startsWith('pet:') && ITEM_BY_ID[id]) next.add(id)
      else if (id.startsWith('color:') && ITEM_BY_ID[`bg:${legacy(id)}`]) next.add(`bg:${legacy(id)}`)
    }
    owned = [...next]
    coins = old.coins ?? 0
  }
  return {
    ...old,
    look,
    owned,
    coins,
    stats: {
      playMs: old.stats?.playMs ?? 0,
      byKind: old.stats?.byKind ?? old.stats?.byWorld ?? {},
      days: old.stats?.days ?? {},
      ms: old.stats?.ms ?? {},
    },
    classNum: old.classNum ?? null,
    // A class joined before list numbers existed has to be joined again.
    classCode: old.classNum ? old.classCode : null,
    classInfo: old.classNum ? (old.classInfo ?? null) : null,
    hw: old.hw ?? null,
    screen: old.screen ?? null,
    sinceEvent: old.sinceEvent ?? 0,
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as AppState
      if (s.v === 1 && Array.isArray(s.profiles))
        return {
          ...s,
          music: s.music ?? true,
          teacher: s.teacher ?? [],
          profiles: s.profiles.map((p) => upgradeProfile(p as unknown as Record<string, unknown>)),
        }
    }
  } catch {
    /* corrupted or unavailable storage: start fresh */
  }
  return { v: 1, lang: detectLang(), sound: true, music: true, profiles: [], activeId: null, teacher: [] }
}

let state: AppState = load()
setSoundEnabled(state.sound)
setMusicEnabled(state.music)
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
export const stopKey = (p: Profile, stop: Stop) => levelKey(stop.kind, p.band, stop.level)
export const stopStars = (p: Profile, stop: Stop) => p.levels[stopKey(p, stop)]?.stars ?? 0
export const stopPlays = (p: Profile, stop: Stop) => p.levels[stopKey(p, stop)]?.plays ?? 0
export const zoneStars = (p: Profile, zone: ZoneId) =>
  JOURNEY.filter((s) => s.zone === zone).reduce((sum, s) => sum + stopStars(p, s), 0)
export const ZONE_MAX_STARS = STOPS_PER_ZONE * 3

/**
 * The journey opens one stop at a time. A star on the previous stop opens the next one — and so
 * do three honest tries, so nobody is ever stuck behind one hard level.
 */
export function isStopOpen(p: Profile, index: number): boolean {
  if (index <= 0) return true
  const prev = JOURNEY[index - 1]
  return isStopOpen(p, index - 1) && (stopStars(p, prev) > 0 || stopPlays(p, prev) >= 3)
}
/** The furthest stop the player can enter. */
export function frontier(p: Profile): number {
  let i = 0
  while (i + 1 < JOURNEY.length && isStopOpen(p, i + 1)) i++
  return i
}
/** First time with this kind of activity on any level: the game shows where to tap. */
export const isNewKind = (p: Profile, kind: string) => !Object.keys(p.levels).some((k) => k.startsWith(`${kind}-`))

function sumWeek(days: Record<string, number>, now = Date.now()): number {
  const start = weekStart(now)
  return Object.entries(days).reduce((s, [day, v]) => (day >= start ? s + v : s), 0)
}
export const weekXp = (p: Profile) => sumWeek(p.stats.days)
export const weekMinutes = (p: Profile) => Math.round(sumWeek(p.stats.ms) / 60000)

/** The class homework, if there is one and its week has not ended. */
export function activeHomework(p: Profile, now = Date.now()): Homework | null {
  const hw = p.classInfo?.homework
  return hw && hw.until >= dayKey(now) ? hw : null
}
export const homeworkStars = (p: Profile, hw: Homework) => (p.hw?.id === hw.id ? p.hw.stars : 0)

/** The class's number-sense mission, while it is open and this child has not done it yet. */
export function pendingScreening(p: Profile, now = Date.now()): Screening | null {
  const s = p.classInfo?.screening
  return s && s.until >= dayKey(now) && p.screen?.id !== s.id ? s : null
}

export const isItemUnlocked = (p: Profile, itemId: string) => {
  const item = ITEM_BY_ID[itemId]
  return !!item && (p.owned.includes(itemId) || (item.stars !== undefined && totalStars(p) >= item.stars))
}

// ───────────── Settings & profiles ─────────────

export const setLang = (lang: Lang) => set({ ...state, lang })
export const setSound = (sound: boolean) => {
  setSoundEnabled(sound)
  set({ ...state, sound })
}
export const setMusic = (music: boolean) => {
  setMusicEnabled(music)
  set({ ...state, music })
}

export function createProfile(name: string, look: Look, band: Band): Profile {
  const p: Profile = {
    id: crypto.randomUUID(),
    secret: crypto.randomUUID(),
    name: name.trim().slice(0, 14),
    look,
    band,
    coins: 0,
    xp: 0,
    levels: {},
    facts: {},
    dojo: { step: DOJO_START[band], streak: 0, lastDay: '', best: {} },
    owned: [...FREE_ITEMS],
    stats: { playMs: 0, byKind: {}, days: {}, ms: {} },
    classCode: null,
    classNum: null,
    classInfo: null,
    hw: null,
    screen: null,
    sinceEvent: 0,
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

function addDay(days: Record<string, number>, amount: number): Record<string, number> {
  const today = dayKey()
  const next = { ...days, [today]: (days[today] ?? 0) + amount }
  // Keep two months of history at most.
  const keys = Object.keys(next).sort()
  for (const k of keys.slice(0, Math.max(0, keys.length - 60))) delete next[k]
  return next
}

function played(cur: Profile, kind: string, result: GameResult, xp: number): Profile['stats'] {
  const prev = cur.stats.byKind[kind] ?? { ok: 0, total: 0 }
  return {
    playMs: cur.stats.playMs + result.ms,
    byKind: { ...cur.stats.byKind, [kind]: { ok: prev.ok + result.correct, total: prev.total + result.total } },
    days: addDay(cur.stats.days, xp),
    ms: addDay(cur.stats.ms, result.ms),
  }
}

export function finishStop(index: number, result: GameResult): Rewards & { previous: number } {
  const p = activeProfile()
  if (!p) throw new Error('No active profile')
  const stop = JOURNEY[index]
  const key = stopKey(p, stop)
  const previous = p.levels[key]?.stars ?? 0
  const rewards = rewardsFor(result, previous)
  patchProfile(p.id, (cur) => ({
    ...cur,
    coins: cur.coins + rewards.coins,
    xp: cur.xp + rewards.xp,
    levels: { ...cur.levels, [key]: { stars: Math.max(previous, rewards.stars), plays: (cur.levels[key]?.plays ?? 0) + 1 } },
    facts: review(cur.facts, result.facts),
    stats: played(cur, stop.kind, result, rewards.xp),
    sinceEvent: cur.sinceEvent + 1,
  }))
  void syncClass()
  return { ...rewards, previous }
}

/** One homework activity: the stars add up towards the teacher's goal. */
export function finishHomework(hw: Homework, kind: string, result: GameResult): Rewards & { progress: number } {
  const p = activeProfile()
  if (!p) throw new Error('No active profile')
  const rewards = rewardsFor(result, 3)
  const before = p.hw?.id === hw.id ? p.hw : { id: hw.id, stars: 0, plays: 0 }
  const progress = before.stars + rewards.stars
  patchProfile(p.id, (cur) => ({
    ...cur,
    coins: cur.coins + rewards.coins,
    xp: cur.xp + rewards.xp,
    facts: review(cur.facts, result.facts),
    stats: played(cur, kind, result, rewards.xp),
    hw: { id: hw.id, stars: progress, plays: before.plays + 1 },
  }))
  void syncClass()
  return { ...rewards, progress }
}

/** Should a surprise jump out before the next level? Never on the first plays, never twice in a row. */
export function rollEvent(rnd: () => number = Math.random): boolean {
  const p = activeProfile()
  if (!p || p.sinceEvent < 2) return false
  return p.sinceEvent >= 5 || rnd() < 0.4
}

export function finishEvent(results: FactResult[], ms: number): { coins: number; correct: number } {
  const p = activeProfile()
  if (!p) throw new Error('No active profile')
  const correct = results.filter((r) => r.correct).length
  const coins = correct * 3
  patchProfile(p.id, (cur) => ({
    ...cur,
    coins: cur.coins + coins,
    xp: cur.xp + correct * 5,
    facts: review(cur.facts, results),
    stats: played(cur, 'event', { correct, total: results.length, ms, facts: results }, correct * 5),
    sinceEvent: 0,
  }))
  return { coins, correct }
}

export const SCREENING_REWARD = 30

/** Stores the mission's measurements for the teacher. The child only gets a thank-you and some points. */
export function finishScreening(id: string, tasks: Record<TaskId, TaskScore>, ms: number) {
  const p = activeProfile()
  if (!p) throw new Error('No active profile')
  patchProfile(p.id, (cur) => ({
    ...cur,
    coins: cur.coins + SCREENING_REWARD,
    xp: cur.xp + 50,
    screen: { id, day: dayKey(), band: cur.band, tasks },
    stats: { ...cur.stats, playMs: cur.stats.playMs + ms, days: addDay(cur.stats.days, 50), ms: addDay(cur.stats.ms, ms) },
  }))
  void syncClass()
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
    stats: { ...cur.stats, playMs: cur.stats.playMs + ms, days: addDay(cur.stats.days, xp), ms: addDay(cur.stats.ms, ms) },
  }))
  void syncClass()
  return { passed, leveledUp, coins, xp, streak, sec, correct, total: results.length }
}

// ───────────── Wardrobe ─────────────

const LOOK_FIELD: Record<ItemType, keyof Look> = { base: 'base', hat: 'hat', glasses: 'glasses', outfit: 'outfit', pet: 'pet', bg: 'bg' }

/** Buys the item if needed (and affordable) and puts it on. False when it stays out of reach. */
export function wearItem(itemId: string): boolean {
  const p = activeProfile()
  const item = ITEM_BY_ID[itemId]
  if (!p || !item) return false
  if (!isItemUnlocked(p, itemId)) {
    if (item.stars !== undefined || p.coins < item.price) return false
    patchProfile(p.id, (cur) => ({ ...cur, coins: cur.coins - item.price, owned: [...cur.owned, itemId] }))
  }
  patchProfile(p.id, (cur) => ({ ...cur, look: { ...cur.look, [LOOK_FIELD[item.type]]: itemName(itemId) } }))
  void syncClass()
  return true
}

/** Takes off a hat, glasses or pet. */
export function takeOff(type: 'hat' | 'glasses' | 'pet') {
  const p = activeProfile()
  if (!p) return
  patchProfile(p.id, (cur) => ({ ...cur, look: { ...cur.look, [type]: null } }))
  void syncClass()
}

/** Skin tone, hair style and hair colour are always free. */
export function styleKid(patch: Partial<Pick<Look, 'tone' | 'hair' | 'hairColor'>>) {
  const p = activeProfile()
  if (!p) return
  patchProfile(p.id, (cur) => ({ ...cur, look: { ...cur.look, ...patch } }))
  void syncClass()
}

// ───────────── Class (child side) ─────────────

export function memberStats(p: Profile): MemberStats {
  return {
    week: weekStart(),
    weekMin: weekMinutes(p),
    byKind: p.stats.byKind,
    dojo: p.dojo.step,
    weak: memoryStats(p.facts).weak.slice(0, 6),
    hw: p.hw ? { id: p.hw.id, stars: p.hw.stars } : null,
    screen: p.screen,
  }
}

export function memberOf(p: Profile): MemberUpsert {
  return { id: p.id, name: p.name, num: p.classNum ?? 1, look: encodeLook(p.look), stars: totalStars(p), xp: p.xp, stats: memberStats(p) }
}

/** Pushes the active player's progress to their class. Failures are silent: the game never blocks on the network. */
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

/** Fetches the class (name, homework, shared stars) and remembers it. Null when the class is gone. */
export async function refreshClass(): Promise<ClassInfo | null> {
  const p = activeProfile()
  if (!p?.classCode) return null
  const backend = await getBackend()
  await syncClass()
  const info = await backend.getClass(p.classCode)
  patchProfile(p.id, (cur) => ({ ...cur, classInfo: info }))
  return info
}

export async function joinClass(code: string, num: number): Promise<boolean> {
  const p = activeProfile()
  if (!p) return false
  const backend = await getBackend()
  const info = await backend.getClass(code)
  if (!info) return false
  await backend.upsertMember(code, { ...memberOf(p), num }, p.secret)
  patchProfile(p.id, (cur) => ({ ...cur, classCode: code, classNum: num, classInfo: info }))
  return true
}

export async function leaveClass(): Promise<void> {
  const p = activeProfile()
  if (!p?.classCode) return
  const backend = await getBackend()
  await backend.leaveClass(p.classCode, p.id, p.secret).catch(() => {})
  patchProfile(p.id, (cur) => ({ ...cur, classCode: null, classNum: null, classInfo: null }))
}

// ───────────── Class (teacher side) ─────────────

export async function teacherCreateClass(name: string): Promise<TeacherClass> {
  const backend = await getBackend()
  const { code, teacherKey } = await backend.createClass(name.trim())
  const entry: TeacherClass = { code, key: teacherKey, name: name.trim(), names: {} }
  set({ ...state, teacher: [...state.teacher, entry] })
  return entry
}

/** Opens an existing class on another device with its code and teacher key. False if they do not match. */
export async function teacherOpenClass(code: string, key: string): Promise<boolean> {
  const backend = await getBackend()
  try {
    await backend.report(code, key)
  } catch {
    return false
  }
  const info = await backend.getClass(code)
  if (!info) return false
  const entry: TeacherClass = { code, key, name: info.name, names: {} }
  set({ ...state, teacher: [...state.teacher.filter((c) => c.code !== code), entry] })
  return true
}

export const teacherForgetClass = (code: string) => set({ ...state, teacher: state.teacher.filter((c) => c.code !== code) })

/** Deletes the class for everybody, with everything the pupils' devices sent to it. */
export async function teacherDeleteClass(code: string): Promise<void> {
  const cls = state.teacher.find((c) => c.code === code)
  if (!cls) return
  const backend = await getBackend()
  await backend.deleteClass(cls.code, cls.key)
  teacherForgetClass(code)
}

/** The name a teacher writes next to a list number. Stored on this device only. */
export function teacherNameStudent(code: string, num: number, name: string) {
  set({
    ...state,
    teacher: state.teacher.map((c) => (c.code === code ? { ...c, names: { ...c.names, [num]: name.slice(0, 30) } } : c)),
  })
}
