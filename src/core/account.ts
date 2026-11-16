import type { SupabaseClient } from '@supabase/supabase-js'
import { cloudConfig } from './backend'

/**
 * Teacher accounts (e-mail and password, through Supabase Auth). An account is a keyring: it
 * remembers which classes are hers and returns their teacher keys; everything else about a class
 * still goes through the key-protected functions. Children never have accounts.
 */
export interface AccountUser {
  id: string
  email: string
}
export interface AccountClass {
  code: string
  name: string
  key: string
  members: number
}

/** Why signing in or up failed, in terms the screen can explain. */
export type AccountError = 'bad' | 'exists' | 'unconfirmed' | 'weak' | 'email' | 'rate' | 'other'

export const accountsAvailable = () => cloudConfig() !== null

let client: Promise<SupabaseClient> | null = null
function db(): Promise<SupabaseClient> {
  client ??= (async () => {
    const cfg = cloudConfig()
    if (!cfg) throw new Error('no-cloud')
    const { makeAccountClient } = await import('./backend/supabase')
    return makeAccountClient(cfg.url, cfg.key)
  })()
  return client
}

export function accountError(message: string | undefined): AccountError {
  const m = (message ?? '').toLowerCase()
  if (m.includes('invalid login')) return 'bad'
  if (m.includes('already registered') || m.includes('already been registered')) return 'exists'
  if (m.includes('not confirmed')) return 'unconfirmed'
  if (m.includes('password')) return 'weak'
  if (m.includes('rate limit') || m.includes('too many') || m.includes('security purposes')) return 'rate'
  if (m.includes('email') || m.includes('e-mail')) return 'email'
  return 'other'
}

const fail = (message?: string): never => {
  throw new Error(accountError(message))
}
const toUser = (u: { id: string; email?: string | null } | null | undefined): AccountUser | null => (u ? { id: u.id, email: u.email ?? '' } : null)

export async function currentUser(): Promise<AccountUser | null> {
  const { data } = await (await db()).auth.getSession()
  return toUser(data.session?.user)
}

/** Calls back on every sign-in and sign-out, and with `recovery` when she arrives from a reset link. */
export async function onAccountChange(cb: (user: AccountUser | null, recovery: boolean) => void): Promise<() => void> {
  const { data } = (await db()).auth.onAuthStateChange((event, session) => cb(toUser(session?.user), event === 'PASSWORD_RECOVERY'))
  return () => data.subscription.unsubscribe()
}

/** 'in' when the account can be used straight away; 'confirm' when a confirmation e-mail was sent first. */
export async function signUp(email: string, password: string): Promise<'in' | 'confirm'> {
  const { data, error } = await (await db()).auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/docente` } })
  if (error) fail(error.message)
  // With confirmations on, an address that already has an account comes back with no identities.
  if (data.user && data.user.identities?.length === 0) fail('already registered')
  return data.session ? 'in' : 'confirm'
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await (await db()).auth.signInWithPassword({ email: email.trim(), password })
  if (error) fail(error.message)
}

export async function signOut(): Promise<void> {
  await (await db()).auth.signOut()
}

export async function sendReset(email: string): Promise<void> {
  const { error } = await (await db()).auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/docente` })
  if (error) fail(error.message)
}

export async function setPassword(password: string): Promise<void> {
  const { error } = await (await db()).auth.updateUser({ password })
  if (error) fail(error.message)
}

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await (await db()).rpc(fn, args)
  if (error) throw new Error(error.message)
  return data as T
}

export const accountClasses = () => rpc<AccountClass[]>('pm_teacher_classes')
export const accountCreateClass = (name: string) => rpc<{ code: string; teacherKey: string }>('pm_teacher_class_create', { p_name: name })
export const accountClaim = (code: string, key: string) => rpc<void>('pm_teacher_claim', { p_code: code, p_key: key })
export const accountRelease = (code: string) => rpc<void>('pm_teacher_release', { p_code: code })
