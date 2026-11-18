import { useSyncExternalStore } from 'react'
import { setSoundEnabled } from './audio'
import { getBackend, type ClassInfo, type Goal, type GroupKind, type Homework, type MemberStats, type MemberUpsert, type Screening } from './backend'
import { PLAN } from './insights'
import { DOJO, DOJO_START, JOURNEY, levelKey, STOPS_PER_ZONE, type Stop } from './curriculum'
import { DEFAULT_LOOK, encodeLook, FREE_ITEMS, ITEM_BY_ID, itemName, ITEMS, LEGACY_SKINS, type ItemType, type KidPatch, type Look } from './look'
import { setMusicEnabled } from './music'
import { dayKey, dojoPassed, giftCoins, rewardsFor, weekStart, type Rewards } from './scoring'
import type { ScreenResult, TaskId, TaskScore } from './screening'
import { currentSeason, SEASON_OF_ITEM, seasonWorld, type Season, type SeasonSetting } from './seasons'
import { memoryStats, review, type Memory } from './srs'
import type { Band, FactResult, GameResult, Lang, ZoneId } from './types'
import { cleanWorld, type World } from './worlds'

export interface LevelRecord {
  stars: number
  plays: number
}

/** A player's link to their family's group. It has its own member id, apart from the one their class sees. */
export interface FamilyLink {
  code: string
  memberId: string
  info: ClassInfo | null
  hw: { id: string; stars: number; plays: number } | null
}

/** Where a mission or a world comes from. */
export type GroupSrc = 'class' | 'family'

export interface WorldRecord {
  stars: number[]
  plays: number[]
  miss: number[][]
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
  /** The family this player is linked to, if a parent connected them: its missions, world and goal. */
  family: FamilyLink | null
  /** Extra worlds (the teacher's, the seasons'): per stop, best stars, visits and the exercises missed last time. */
  worlds: Record<string, WorldRecord>
  /** Latest number-sense mission the child completed. */
  screen: ScreenResult | null
  /** Matty's daily present: the last day it was opened and how many days in a row. */
  gift: { day: string; streak: number } | null
  /** Levels played since the last surprise event. */
  sinceEvent: number
  createdAt: number
}

/** A class this device manages as a teacher. Names never leave the device. */
export interface TeacherClass {
  code: string
  key: string
  name: string
  /** A class of pupils, or a family run by a parent. */
  kind: GroupKind
  names: Record<string, string>
  /** Her notes next to each list number. Like the names, on this device unless she keeps them online. */
  notes: Record<string, string>
}

export interface AppState {
  v: 1
  lang: Lang
  sound: boolean
  music: boolean
  /** Seasonal dress-up: by the calendar, never, or one season fixed. */
  season: SeasonSetting
  profiles: Profile[]
  activeId: string | null
  teacher: TeacherClass[]
  /** Keep the names and notes of the classes online too, to see them from any device. Off unless she turns it on. */
  rosterOnline: boolean
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
    // Faces gained features over time: whatever a saved look lacks takes the default.
    look: { ...DEFAULT_LOOK, ...look },
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
    family: old.family ?? null,
    worlds: old.worlds ?? {},
    screen: old.screen ?? null,
    gift: old.gift ?? null,
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
          season: s.season ?? 'auto',
          teacher: (s.teacher ?? []).map((c) => ({ ...c, notes: c.notes ?? {}, kind: c.kind ?? 'class' })),
          rosterOnline: s.rosterOnline ?? false,
          profiles: s.profiles.map((p) => upgradeProfile(p as unknown as Record<string, unknown>)),
        }
    }
  } catch {
    /* corrupted or unavailable storage: start fresh */
  }
  return { v: 1, lang: detectLang(), sound: true, music: true, season: 'auto', profiles: [], activeId: null, teacher: [], rosterOnline: false }
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
/** The opening game is saved in the dice race's first slot, but it is not a dice race: it does not count here. */
export const isNewKind = (p: Profile, kind: string) =>
  !Object.keys(p.levels).some((k) => k.startsWith(`${kind}-`) && k !== stopKey(p, JOURNEY[0]))

function sumWeek(days: Record<string, number>, now = Date.now()): number {
  const start = weekStart(now)
  return Object.entries(days).reduce((s, [day, v]) => (day >= start ? s + v : s), 0)
}
export const weekXp = (p: Profile) => sumWeek(p.stats.days)
/** Minutes played this week. Any play counts as a minute started, so a short session never reads as none. */
export const weekMinutes = (p: Profile) => Math.ceil(sumWeek(p.stats.ms) / 60000)
/** Days played since Monday. */
export const weekDays = (p: Profile, now = Date.now()) => {
  const start = weekStart(now)
  return Object.entries(p.stats.ms).filter(([day, ms]) => day >= start && ms > 0).length
}

const groupInfo = (p: Profile, src: GroupSrc) => (src === 'class' ? p.classInfo : (p.family?.info ?? null))
const hwRecord = (p: Profile, src: GroupSrc) => (src === 'class' ? p.hw : (p.family?.hw ?? null))

/** The class homework — or the family's mission — if there is one and its week has not ended. */
export function activeHomework(p: Profile, now = Date.now(), src: GroupSrc = 'class'): Homework | null {
  const hw = groupInfo(p, src)?.homework
  return hw && hw.until >= dayKey(now) ? hw : null
}
export const homeworkStars = (p: Profile, hw: Homework, src: GroupSrc = 'class') => (hwRecord(p, src)?.id === hw.id ? (hwRecord(p, src)?.stars ?? 0) : 0)
export const homeworkPlays = (p: Profile, hw: Homework | null, src: GroupSrc = 'class') => (hw && hwRecord(p, src)?.id === hw.id ? (hwRecord(p, src)?.plays ?? 0) : 0)

/** The weekly routine this player aims for: their family's, else their class's, else the recommended one. */
export const weeklyGoal = (p: Profile): Goal => p.family?.info?.goal ?? p.classInfo?.goal ?? PLAN

/** The class's number-sense mission, while it is open and this child has not done it yet. */
export function pendingScreening(p: Profile, now = Date.now()): Screening | null {
  const s = p.classInfo?.screening
  return s && s.until >= dayKey(now) && p.screen?.id !== s.id ? s : null
}

/** The season dressing the game right now, if any. */
export const activeSeason = (s: AppState = state, now = new Date()): Season | null => currentSeason(s.season, now)
export const useSeason = () => activeSeason(useApp((s) => s))
export const setSeason = (season: SeasonSetting) => set({ ...state, season })

/** The world the teacher made for this child's class. */
export const classWorld = (p: Profile): World | null => cleanWorld(p.classInfo?.world)
/** The world this child's family made. */
export const familyWorld = (p: Profile): World | null => cleanWorld(p.family?.info?.world)
/** The running season's world for this child's age. */
export const seasonWorldOf = (p: Profile, season: Season | null = activeSeason()): World | null => (season ? seasonWorld(season, p.band) : null)

const EMPTY_RECORD: WorldRecord = { stars: [], plays: [], miss: [] }
export const worldRecord = (p: Profile, world: World): WorldRecord => p.worlds[world.id] ?? EMPTY_RECORD
export const worldStars = (p: Profile, world: World) => world.stops.reduce((s, _, i) => s + (worldRecord(p, world).stars[i] ?? 0), 0)
/** Like the journey: a stop opens once the one before has been visited. */
export const isWorldStopOpen = (p: Profile, world: World, i: number) => i === 0 || (worldRecord(p, world).plays[i - 1] ?? 0) > 0
export const worldDone = (p: Profile, world: World) => world.stops.every((_, i) => (worldRecord(p, world).stars[i] ?? 0) > 0)

/** Seasonal items are sold only during their season; prizes are never sold. */
export const isItemOnOffer = (p: Profile, itemId: string, season: Season | null = activeSeason()) =>
  p.owned.includes(itemId) || !SEASON_OF_ITEM[itemId] || SEASON_OF_ITEM[itemId] === season?.id

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
    family: null,
    worlds: {},
    screen: null,
    gift: null,
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

export function finishStop(index: number, result: GameResult): Rewards & { previous: number; gifts: string[] } {
  const p = activeProfile()
  if (!p) throw new Error('No active profile')
  const stop = JOURNEY[index]
  const key = stopKey(p, stop)
  const previous = p.levels[key]?.stars ?? 0
  const rewards = rewardsFor(result, previous)
  // Star milestones crossed by this level: the things Matty hands over as presents.
  const before = totalStars(p)
  const after = before + Math.max(0, rewards.stars - previous)
  const gifts = ITEMS.filter((i) => i.stars !== undefined && i.stars > before && i.stars <= after).map((i) => i.id)
  patchProfile(p.id, (cur) => ({
    ...cur,
    coins: cur.coins + rewards.coins,
    xp: cur.xp + rewards.xp,
    levels: { ...cur.levels, [key]: { stars: Math.max(previous, rewards.stars), plays: (cur.levels[key]?.plays ?? 0) + 1 } },
    facts: review(cur.facts, result.facts),
    stats: played(cur, stop.opener ? 'launch' : stop.kind, result, rewards.xp),
    sinceEvent: cur.sinceEvent + 1,
  }))
  void syncClass()
  return { ...rewards, previous, gifts }
}

/** Matty has a present waiting once a day. */
export const giftReady = (p: Profile, now = Date.now()) => p.gift?.day !== dayKey(now)

/** Opens today's present and returns the points inside (0 if it was already opened). */
export function claimGift(): number {
  const p = activeProfile()
  if (!p || !giftReady(p)) return 0
  const yesterday = dayKey(Date.now() - 24 * 60 * 60 * 1000)
  const streak = p.gift?.day === yesterday ? p.gift.streak + 1 : 1
  const coins = giftCoins(streak)
  patchProfile(p.id, (cur) => ({ ...cur, coins: cur.coins + coins, gift: { day: dayKey(), streak } }))
  return coins
}

/** One homework activity: the stars add up towards the teacher's goal. */
export function finishHomework(hw: Homework, kind: string, result: GameResult, src: GroupSrc = 'class'): Rewards & { progress: number } {
  const p = activeProfile()
  if (!p) throw new Error('No active profile')
  const rewards = rewardsFor(result, 3)
  const had = hwRecord(p, src)
  const before = had?.id === hw.id ? had : { id: hw.id, stars: 0, plays: 0 }
  const progress = before.stars + rewards.stars
  const record = { id: hw.id, stars: progress, plays: before.plays + 1 }
  patchProfile(p.id, (cur) => ({
    ...cur,
    coins: cur.coins + rewards.coins,
    xp: cur.xp + rewards.xp,
    facts: review(cur.facts, result.facts),
    stats: played(cur, kind, result, rewards.xp),
    ...(src === 'class' ? { hw: record } : { family: cur.family ? { ...cur.family, hw: record } : null }),
  }))
  void syncClass()
  return { ...rewards, progress }
}

/**
 * One stop of an extra world. `missed` lists the teacher's own exercises that went wrong (they are
 * not number facts, so they stay out of the spaced-repetition memory). Finishing a season's world
 * hands over its prize.
 */
export function finishWorldStop(world: World, index: number, kind: string, result: GameResult, missed: number[] | null): Rewards & { gifts: string[] } {
  const p = activeProfile()
  if (!p) throw new Error('No active profile')
  const rec = worldRecord(p, world)
  const previous = rec.stars[index] ?? 0
  const rewards = rewardsFor(result, previous)
  const pad = (xs: number[]) => world.stops.map((_, i) => xs[i] ?? 0)
  const next: WorldRecord = {
    stars: pad(rec.stars).map((s, i) => (i === index ? Math.max(s, rewards.stars) : s)),
    plays: pad(rec.plays).map((n, i) => (i === index ? n + 1 : n)),
    miss: world.stops.map((_, i) => (i === index ? (missed ?? []) : (rec.miss[i] ?? []))),
  }
  const season = activeSeason()
  const prize = season && seasonWorld(season, p.band).id === world.id ? season.prize : null
  const won = prize && !p.owned.includes(prize) && next.stars.every((s) => s > 0) ? [prize] : []
  // Old editions and replaced class worlds are forgotten: only the latest few are kept.
  const kept = Object.entries(p.worlds).filter(([id]) => id !== world.id).slice(-3)
  patchProfile(p.id, (cur) => ({
    ...cur,
    coins: cur.coins + rewards.coins,
    xp: cur.xp + rewards.xp,
    facts: missed ? cur.facts : review(cur.facts, result.facts),
    stats: played(cur, kind, result, rewards.xp),
    worlds: { ...Object.fromEntries(kept), [world.id]: next },
    owned: [...cur.owned, ...won],
  }))
  void syncClass()
  return { ...rewards, gifts: won }
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
    if (item.stars !== undefined || item.prize || !isItemOnOffer(p, itemId) || p.coins < item.price) return false
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
export function styleKid(patch: KidPatch) {
  const p = activeProfile()
  if (!p) return
  patchProfile(p.id, (cur) => ({ ...cur, look: { ...cur.look, ...patch } }))
  void syncClass()
}

// ───────────── Class and family (child side) ─────────────

export function memberStats(p: Profile, src: GroupSrc = 'class'): MemberStats {
  const world = src === 'class' ? classWorld(p) : familyWorld(p)
  const hw = hwRecord(p, src)
  return {
    week: weekStart(),
    weekMin: weekMinutes(p),
    days: weekDays(p),
    totalMin: Math.round(p.stats.playMs / 60000),
    byKind: p.stats.byKind,
    dojo: p.dojo.step,
    weak: memoryStats(p.facts).weak.slice(0, 6),
    hw: hw ? { id: hw.id, stars: hw.stars } : null,
    world: world ? { id: world.id, ...(({ stars, miss }) => ({ stars, miss }))(worldRecord(p, world)) } : null,
    // Only the school sees the number-sense mission: it means nothing outside a group to compare with.
    screen: src === 'class' ? p.screen : null,
  }
}

export function memberOf(p: Profile, src: GroupSrc = 'class'): MemberUpsert {
  return {
    id: src === 'class' ? p.id : (p.family?.memberId ?? p.id),
    name: p.name,
    num: src === 'class' ? (p.classNum ?? 1) : 1,
    look: encodeLook(p.look),
    stars: totalStars(p),
    xp: p.xp,
    stats: memberStats(p, src),
  }
}

/** Pushes the active player's progress to their class and to their family. Failures are silent: the game never blocks on the network. */
export async function syncClass(): Promise<void> {
  const p = activeProfile()
  if (!p || (!p.classCode && !p.family)) return
  try {
    const backend = await getBackend()
    if (p.classCode) await backend.upsertMember(p.classCode, memberOf(p), p.secret).catch(() => {})
    if (p.family) await backend.upsertMember(p.family.code, memberOf(p, 'family'), p.secret).catch(() => {})
  } catch {
    /* offline: the next sync will catch up */
  }
}

/** Fetches the class and the family (missions, worlds, goals) and remembers them. Returns the class, null when it is gone. */
export async function refreshClass(): Promise<ClassInfo | null> {
  const p = activeProfile()
  if (!p || (!p.classCode && !p.family)) return null
  const backend = await getBackend()
  await syncClass()
  const info = p.classCode ? await backend.getClass(p.classCode) : null
  const home = p.family ? await backend.getClass(p.family.code).catch(() => p.family?.info ?? null) : null
  patchProfile(p.id, (cur) => ({
    ...cur,
    classInfo: cur.classCode ? info : cur.classInfo,
    // A family that no longer exists is simply let go of.
    family: cur.family ? (home ? { ...cur.family, info: home } : null) : null,
  }))
  return info
}

export async function joinClass(code: string, num: number): Promise<boolean> {
  const p = activeProfile()
  if (!p) return false
  const backend = await getBackend()
  const info = await backend.getClass(code)
  if (!info) return false
  // A family's code typed where a class code goes still does the right thing.
  if (info.kind === 'family') return joinFamily(code)
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

/** Links the active player to a family with the code their parent gave them. False if it is not a family's code. */
export async function joinFamily(code: string): Promise<boolean> {
  const p = activeProfile()
  if (!p) return false
  const backend = await getBackend()
  const info = await backend.getClass(code)
  if (!info || info.kind !== 'family') return false
  const link: FamilyLink = p.family?.code === code ? { ...p.family, info } : { code, memberId: crypto.randomUUID(), info, hw: null }
  await backend.upsertMember(code, { ...memberOf({ ...p, family: link }, 'family') }, p.secret)
  patchProfile(p.id, (cur) => ({ ...cur, family: link }))
  return true
}

export async function leaveFamily(): Promise<void> {
  const p = activeProfile()
  if (!p?.family) return
  const backend = await getBackend()
  await backend.leaveClass(p.family.code, p.family.memberId, p.secret).catch(() => {})
  patchProfile(p.id, (cur) => ({ ...cur, family: null }))
}

// ───────────── Class (teacher side) ─────────────

export async function teacherCreateClass(name: string, kind: GroupKind = 'class'): Promise<TeacherClass> {
  const backend = await getBackend()
  const { code, teacherKey } = await backend.createClass(name.trim(), kind)
  const entry: TeacherClass = { code, key: teacherKey, name: name.trim(), kind, names: {}, notes: {} }
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
  const entry: TeacherClass = { code, key, name: info.name, kind: info.kind ?? 'class', names: {}, notes: {} }
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

/** Launches (or withdraws, with null) a world for the class. */
export async function teacherSetWorld(code: string, world: World | null): Promise<void> {
  const cls = state.teacher.find((c) => c.code === code)
  if (!cls) return
  const backend = await getBackend()
  await backend.setWorld(cls.code, cls.key, world)
}

/** What a teacher writes next to a list number: a name, a note. On this device, and online only if she chose that. */
export function teacherWriteStudent(code: string, num: number, patch: { name?: string; note?: string }) {
  const cls = state.teacher.find((c) => c.code === code)
  if (!cls) return
  const name = (patch.name ?? cls.names[num] ?? '').slice(0, 30)
  const note = (patch.note ?? cls.notes[num] ?? '').slice(0, 600)
  set({
    ...state,
    teacher: state.teacher.map((c) => (c.code === code ? { ...c, names: { ...c.names, [num]: name }, notes: { ...c.notes, [num]: note } } : c)),
  })
  if (state.rosterOnline) void getBackend().then((b) => b.setRoster(cls.code, cls.key, num, { name, note })).catch(() => {})
}
export const teacherNameStudent = (code: string, num: number, name: string) => teacherWriteStudent(code, num, { name })

/** Brings the names and notes kept online to this device (what is online wins). Does nothing while that is off. */
export async function teacherPullRoster(code: string): Promise<void> {
  const cls = state.teacher.find((c) => c.code === code)
  if (!cls || !state.rosterOnline) return
  const roster = await (await getBackend()).roster(cls.code, cls.key)
  const names = { ...cls.names }
  const notes = { ...cls.notes }
  for (const [num, entry] of Object.entries(roster)) {
    names[num] = entry.name
    notes[num] = entry.note
  }
  set({ ...state, teacher: state.teacher.map((c) => (c.code === code ? { ...c, names, notes } : c)) })
}

/** Turns keeping names and notes online on (uploading what this device has) or off (erasing them from the server). */
export async function setRosterOnline(on: boolean): Promise<void> {
  const backend = await getBackend()
  for (const cls of state.teacher) {
    if (!on) await backend.clearRoster(cls.code, cls.key)
    else
      for (const num of new Set([...Object.keys(cls.names), ...Object.keys(cls.notes)])) {
        const entry = { name: cls.names[num] ?? '', note: cls.notes[num] ?? '' }
        if (entry.name || entry.note) await backend.setRoster(cls.code, cls.key, Number(num), entry)
      }
  }
  set({ ...state, rosterOnline: on })
}

/** Replaces the classes this device manages with the ones of the signed-in account, keeping local names and notes. */
export function setTeacherClasses(classes: { code: string; key: string; name: string; kind?: GroupKind }[]) {
  const before = new Map(state.teacher.map((c) => [c.code, c]))
  set({
    ...state,
    teacher: classes.map((c) => ({
      code: c.code,
      key: c.key,
      name: c.name,
      kind: c.kind ?? before.get(c.code)?.kind ?? 'class',
      names: before.get(c.code)?.names ?? {},
      notes: before.get(c.code)?.notes ?? {},
    })),
  })
}

/** Sets (or clears, with null) the weekly routine of a group this device manages. */
export async function teacherSetGoal(code: string, goal: Goal | null): Promise<void> {
  const cls = state.teacher.find((c) => c.code === code)
  if (!cls) return
  await (await getBackend()).setGoal(cls.code, cls.key, goal)
}
