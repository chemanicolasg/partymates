import { newCode, type Backend, type ClassRoom, type Member, type Team } from './index'

const KEY = 'partymates.classes.v1'

interface Stored {
  name: string
  teams: Team[]
  members: Record<string, Member>
}

/** Classes kept on this device: perfect for a shared tablet or siblings, no internet needed. */
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

  async createClass(name: string) {
    const all = this.read()
    let code = newCode()
    while (all[code]) code = newCode()
    all[code] = { name, teams: [], members: {} }
    this.write(all)
    return code
  }

  async getClass(code: string): Promise<ClassRoom | null> {
    const c = this.read()[code]
    return c ? { code, name: c.name, teams: c.teams, members: Object.values(c.members) } : null
  }

  async upsertMember(code: string, member: Omit<Member, 'updatedAt'>) {
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

  async createTeam(code: string, name: string, emoji: string) {
    const all = this.read()
    if (!all[code]) throw new Error('class-not-found')
    const team = { id: crypto.randomUUID(), name, emoji }
    all[code].teams.push(team)
    this.write(all)
    return team
  }
}
