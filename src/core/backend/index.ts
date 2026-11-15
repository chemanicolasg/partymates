import { LocalBackend } from './local'

export interface Team {
  id: string
  name: string
  emoji: string
}

/** What classmates can see about each other: a nickname, an avatar and scores. Nothing personal. */
export interface Member {
  id: string
  name: string
  skin: string
  color: string
  pet: string | null
  stars: number
  xp: number
  /** XP earned during `week` (the Monday that week started on). */
  weekXp: number
  week: string
  teamId: string | null
  updatedAt: number
}

export interface ClassRoom {
  code: string
  name: string
  members: Member[]
  teams: Team[]
}

export interface Backend {
  /** 'local' keeps classes on this device only; 'cloud' shares them between devices. */
  mode: 'local' | 'cloud'
  createClass(name: string): Promise<string>
  getClass(code: string): Promise<ClassRoom | null>
  /** Joins the class or refreshes the member's scores. `secret` proves the row is theirs. */
  upsertMember(code: string, member: Omit<Member, 'updatedAt'>, secret: string): Promise<void>
  leaveClass(code: string, memberId: string, secret: string): Promise<void>
  createTeam(code: string, name: string, emoji: string): Promise<Team>
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const newCode = () =>
  Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('')
export const normalizeCode = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)

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
