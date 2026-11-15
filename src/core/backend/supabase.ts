import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Backend, ClassRoom, Member, Team } from './index'

/**
 * Cloud classes on Supabase. Tables are closed by row-level security; every call goes through the
 * `pm_*` functions in supabase/migrations, which only ever expose nicknames, avatars and scores.
 */
export class SupabaseBackend implements Backend {
  mode = 'cloud' as const
  private db: SupabaseClient

  constructor(url: string, key: string) {
    this.db = createClient(url, key, { auth: { persistSession: false } })
  }

  private async rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await this.db.rpc(fn, args)
    if (error) throw new Error(error.message)
    return data as T
  }

  createClass(name: string) {
    return this.rpc<string>('pm_create_class', { p_name: name })
  }

  getClass(code: string) {
    return this.rpc<ClassRoom | null>('pm_get_class', { p_code: code })
  }

  async upsertMember(code: string, m: Omit<Member, 'updatedAt'>, secret: string) {
    await this.rpc('pm_upsert_member', {
      p_code: code,
      p_id: m.id,
      p_secret: secret,
      p_name: m.name,
      p_skin: m.skin,
      p_color: m.color,
      p_pet: m.pet,
      p_stars: m.stars,
      p_xp: m.xp,
      p_week_xp: m.weekXp,
      p_week: m.week,
      p_team_id: m.teamId,
    })
  }

  async leaveClass(_code: string, memberId: string, secret: string) {
    await this.rpc('pm_leave_class', { p_id: memberId, p_secret: secret })
  }

  createTeam(code: string, name: string, emoji: string) {
    return this.rpc<Team>('pm_create_team', { p_code: code, p_name: name, p_emoji: emoji })
  }
}
