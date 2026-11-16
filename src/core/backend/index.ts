import type { ScreenResult } from '../screening'
import type { World } from '../worlds'
import { LocalBackend } from './local'

/** The theme of the week a teacher sets for the class. */
export interface Homework {
  id: string
  topic: string
  /** Stars to earn on the topic. */
  goal: number
  /** Last day it counts (YYYY-MM-DD). */
  until: string
  /** From a family: a few words of encouragement and, if they like, what awaits at the end. */
  note?: string
  prize?: string
}

/** A group is a class run by a teacher or a family run by a parent. */
export type GroupKind = 'class' | 'family'

/** The weekly routine a group aims for. */
export interface Goal {
  days: number
  minutes: number
}

/** The number-sense mission a teacher opens for the class for a while. */
export interface Screening {
  id: string
  until: string
}

/** What a child's device learns about its class: no classmates, no rankings. */
export interface ClassInfo {
  code: string
  name: string
  kind?: GroupKind
  goal?: Goal | null
  homework: Homework | null
  screening: Screening | null
  /** A world the teacher put together for the class. */
  world?: World | null
  members: number
  /** Stars earned by the whole class together. */
  stars: number
}

/** Progress summary each device sends for the teacher's report. */
export interface MemberStats {
  /** Monday of the week the numbers below belong to. */
  week: string
  weekMin: number
  /** Days played this week: the routine matters more than the minutes. */
  days?: number
  /** Minutes played since the beginning. */
  totalMin?: number
  byKind: Record<string, { ok: number; total: number }>
  dojo: number
  /** Number facts that keep slipping, e.g. "7x8". */
  weak: string[]
  hw: { id: string; stars: number } | null
  /** Progress in the teacher's world: best stars per stop and, for her own exercises, the ones missed last time. */
  world?: { id: string; stars: number[]; miss: number[][] } | null
  /** Latest number-sense mission, if the child has done one. */
  screen?: ScreenResult | null
}

export interface MemberUpsert {
  id: string
  name: string
  /** Class list number: how the teacher knows who is who without storing real names. */
  num: number
  look: string
  stars: number
  xp: number
  stats: MemberStats
}

/** One week of a pupil's history. */
export interface WeekLine {
  week: string
  min: number
  days: number
  stars: number
}

export interface MemberReport extends MemberUpsert {
  updatedAt: number
  /** Up to ten weeks, oldest first. */
  weeks?: WeekLine[]
}

/** What a teacher writes next to a list number. */
export interface RosterEntry {
  name: string
  note: string
}
export type Roster = Record<string, RosterEntry>

export interface Backend {
  /** 'local' keeps classes on this device only; 'cloud' shares them between devices. */
  mode: 'local' | 'cloud'
  createClass(name: string, kind?: GroupKind): Promise<{ code: string; teacherKey: string }>
  getClass(code: string): Promise<ClassInfo | null>
  /** Joins the class or refreshes the member's progress. `secret` proves the row is theirs. */
  upsertMember(code: string, member: MemberUpsert, secret: string): Promise<void>
  leaveClass(code: string, memberId: string, secret: string): Promise<void>
  /** Teacher only: fails with 'bad-key' unless the teacher key matches. */
  report(code: string, teacherKey: string): Promise<MemberReport[]>
  setHomework(code: string, teacherKey: string, homework: Homework | null): Promise<void>
  setScreening(code: string, teacherKey: string, screening: Screening | null): Promise<void>
  setWorld(code: string, teacherKey: string, world: World | null): Promise<void>
  setGoal(code: string, teacherKey: string, goal: Goal | null): Promise<void>
  removeMember(code: string, teacherKey: string, memberId: string): Promise<void>
  /** Names and notes kept with the class, for teachers who choose to keep them online. */
  roster(code: string, teacherKey: string): Promise<Roster>
  setRoster(code: string, teacherKey: string, num: number, entry: RosterEntry): Promise<void>
  clearRoster(code: string, teacherKey: string): Promise<void>
  /** Deletes the class and everything its pupils sent to it. */
  deleteClass(code: string, teacherKey: string): Promise<void>
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const newCode = (length = 6) => Array.from({ length }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')
export const normalizeCode = (raw: string, length = 6) => raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, length)

export const cloudConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  return url && key ? { url, key } : null
}

let backend: Promise<Backend> | null = null

/** The cloud client is only downloaded when the app was built with Supabase credentials. */
export function getBackend(): Promise<Backend> {
  backend ??= (async () => {
    const cfg = cloudConfig()
    if (!cfg) return new LocalBackend()
    const { SupabaseBackend } = await import('./supabase')
    return new SupabaseBackend(cfg.url, cfg.key)
  })()
  return backend
}
