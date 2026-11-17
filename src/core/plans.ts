/**
 * Plans. Everything is free today; this is the ground for charging adults later without touching
 * the children's game. A plan belongs to an account (a teacher's or a family's), lives on the
 * server and can only be changed there (supabase/migrations/0008_plans.sql). Children have no
 * accounts and never meet a price.
 */
export const PLAN_IDS = ['free', 'family', 'teacher', 'school'] as const
export type PlanId = (typeof PLAN_IDS)[number]

export interface AccountPlan {
  plan: PlanId
  /** Paid until this moment; null when the plan has no end (or is the free one). */
  until: number | null
  /** When the account was made: whoever was here before prices existed can be treated accordingly. */
  since: number | null
  /** Classes and families the account can keep. */
  groups: number
}

export const FREE_PLAN: AccountPlan = { plan: 'free', until: null, since: null, groups: 40 }

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null)

/**
 * What the server said about the account, made safe: anything missing, unknown or run out is the
 * free plan. A copy of the app older than a new plan must keep working, never lock anyone out.
 */
export function readPlan(raw: unknown, now = Date.now()): AccountPlan {
  if (!raw || typeof raw !== 'object') return FREE_PLAN
  const r = raw as { plan?: unknown; until?: unknown; since?: unknown; limits?: { groups?: unknown } | null }
  const until = num(r.until)
  const known = PLAN_IDS.includes(r.plan as PlanId) ? (r.plan as PlanId) : 'free'
  const live = until === null || until > now
  const groups = num(r.limits?.groups)
  return {
    plan: live ? known : 'free',
    until: live && known !== 'free' ? until : null,
    since: num(r.since),
    groups: groups === null ? FREE_PLAN.groups : Math.floor(groups),
  }
}
