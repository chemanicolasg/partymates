import { readJoinLink } from './insights'

/** Which of the grown-ups' places this address is, if any: the teachers' panel or the families' one. */
const path = typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') : ''
export const portal: 'teacher' | 'family' | null = path === '/docente' ? 'teacher' : path === '/familia' ? 'family' : null

/** Reads a family link's query. Null unless it carries a well-formed code. */
export function readFamilyLink(search: string): string | null {
  const code = (new URLSearchParams(search).get('familia') ?? '').toUpperCase()
  return /^[A-Z0-9]{6}$/.test(code) ? code : null
}

/**
 * A group a child is on the way into, from the link or QR code they were given: a class with
 * their list number, or their family. Read once, on arrival.
 */
export type Invitation = { kind: 'class'; code: string; num: number | null } | { kind: 'family'; code: string }

function read(): Invitation | null {
  if (typeof window === 'undefined' || portal) return null
  const family = readFamilyLink(window.location.search)
  if (family) return { kind: 'family', code: family }
  const cls = readJoinLink(window.location.search)
  return cls ? { kind: 'class', ...cls } : null
}

let invitation = read()
// The address bar is tidied up straight away: a reload or a bookmark should not ask again.
if (invitation) history.replaceState(history.state, '', window.location.pathname)

export const peekInvitation = () => invitation
export function takeInvitation() {
  const taken = invitation
  invitation = null
  return taken
}
