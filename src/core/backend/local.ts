import { newCode, type Backend, type ClassInfo, type Homework, type MemberReport, type MemberUpsert, type Screening } from './index'

const KEY = 'matty.classes.v2'

interface Stored {
  name: string
  teacherKey: string
  homework: Homework | null
  screening?: Screening | null
  members: Record<string, MemberReport>
}

/** Classes kept on this device: for a shared tablet or for trying things out with no internet. */
export class LocalBackend implements Backend {
  mode = 'local' as const

  private read(): Record<string, Stored> {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '{}')
    } catch {
      return {}
    }
  }
  private write(all: Record<string, Stored>) {
    localStorage.setItem(KEY, JSON.stringify(all))
  }
  private teacher(code: string, teacherKey: string) {
    const all = this.read()
    if (!all[code] || all[code].teacherKey !== teacherKey) throw new Error('bad-key')
    return all
  }

  async createClass(name: string) {
    const all = this.read()
    let code = newCode()
    while (all[code]) code = newCode()
    const teacherKey = newCode(8)
    all[code] = { name, teacherKey, homework: null, members: {} }
    this.write(all)
    return { code, teacherKey }
  }

  async getClass(code: string): Promise<ClassInfo | null> {
    const c = this.read()[code]
    if (!c) return null
    const members = Object.values(c.members)
    return { code, name: c.name, homework: c.homework, screening: c.screening ?? null, members: members.length, stars: members.reduce((s, m) => s + m.stars, 0) }
  }

  async upsertMember(code: string, member: MemberUpsert) {
    const all = this.read()
    if (!all[code]) throw new Error('class-not-found')
    all[code].members[member.id] = { ...member, updatedAt: Date.now() }
    this.write(all)
  }

  async leaveClass(code: string, memberId: string) {
    const all = this.read()
    if (all[code]) delete all[code].members[memberId]
    this.write(all)
  }

  async report(code: string, teacherKey: string) {
    return Object.values(this.teacher(code, teacherKey)[code].members)
  }

  async setHomework(code: string, teacherKey: string, homework: Homework | null) {
    const all = this.teacher(code, teacherKey)
    all[code].homework = homework
    this.write(all)
  }

  async setScreening(code: string, teacherKey: string, screening: Screening | null) {
    const all = this.teacher(code, teacherKey)
    all[code].screening = screening
    this.write(all)
  }

  async removeMember(code: string, teacherKey: string, memberId: string) {
    const all = this.teacher(code, teacherKey)
    delete all[code].members[memberId]
    this.write(all)
  }

  async deleteClass(code: string, teacherKey: string) {
    const all = this.teacher(code, teacherKey)
    delete all[code]
    this.write(all)
  }
}
