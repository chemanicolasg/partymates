import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Backend, ClassInfo, Homework, MemberReport, MemberUpsert } from './index'

/**
 * Cloud classes on Supabase. Tables are closed; every call goes through the functions in
 * supabase/migrations. Children's devices can only read the class name and its homework;
 * the per-child report needs the teacher key.
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
    return this.rpc<{ code: string; teacherKey: string }>('pm_class_create', { p_name: name })
  }

  getClass(code: string) {
    return this.rpc<ClassInfo | null>('pm_class_get', { p_code: code })
  }

  async upsertMember(code: string, m: MemberUpsert, secret: string) {
    await this.rpc('pm_member_upsert', {
      p_code: code,
      p_id: m.id,
      p_secret: secret,
      p_name: m.name,
      p_num: m.num,
      p_look: m.look,
      p_stars: m.stars,
      p_xp: m.xp,
      p_stats: m.stats,
    })
  }

  async leaveClass(_code: string, memberId: string, secret: string) {
    await this.rpc('pm_leave_class', { p_id: memberId, p_secret: secret })
  }

  report(code: string, teacherKey: string) {
    return this.rpc<MemberReport[]>('pm_class_report', { p_code: code, p_key: teacherKey })
  }

  async setHomework(code: string, teacherKey: string, homework: Homework | null) {
    await this.rpc('pm_class_set_homework', { p_code: code, p_key: teacherKey, p_homework: homework })
  }

  async removeMember(code: string, teacherKey: string, memberId: string) {
    await this.rpc('pm_class_remove_member', { p_code: code, p_key: teacherKey, p_member: memberId })
  }

  async deleteClass(code: string, teacherKey: string) {
    await this.rpc('pm_class_delete', { p_code: code, p_key: teacherKey })
  }
}
