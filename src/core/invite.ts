import { readJoinLink } from './insights'

/** The teachers' panel lives at its own address. */
export const isPortal = typeof window !== 'undefined' && window.location.pathname.replace(/\/+$/, '') === '/docente'

/** A class a child is on the way into, from the link or QR code on their card. Read once, on arrival. */
let invitation = typeof window !== 'undefined' && !isPortal ? readJoinLink(window.location.search) : null
// The address bar is tidied up straight away: a reload or a bookmark should not ask again.
if (invitation) history.replaceState(history.state, '', window.location.pathname)

export const peekInvitation = () => invitation
export function takeInvitation() {
  const taken = invitation
  invitation = null
  return taken
}
