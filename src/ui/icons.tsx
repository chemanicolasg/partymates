import type { ReactNode } from 'react'
import type { PlayKind } from '../core/types'

/**
 * The app's own icons. Emoji look different on every system (and flat or dated on some), so the
 * parts of the interface that are always on screen — the map, the bars, the activity badges —
 * use these instead: flat shapes with one lighter and one darker tone, no outlines.
 */
export type IconName =
  | 'star'
  | 'coin'
  | 'calendar'
  | 'music'
  | 'musicOff'
  | 'dice'
  | 'bricks'
  | 'stones'
  | 'bolt'
  | 'gem'
  | 'cards'
  | 'pencil'
  | 'lock'
  | 'crown'
  | 'school'
  | 'shirt'
  | 'adult'
  | 'players'
  | 'rocket'
  | 'book'
  | 'globe'
  | 'sound'
  | 'retry'
  | 'map'
  | 'play'
  | 'gift'
  | 'heart'

const ICONS: Record<IconName, ReactNode> = {
  star: (
    <>
      <path d="M12 1.8l3 6.3 6.9.9-5 4.8 1.2 6.9L12 17.4 5.9 20.7l1.2-6.9-5-4.8 6.9-.9z" fill="#ffc21a" />
      <path d="M12 1.8l3 6.3 6.9.9-5 4.8L12 12z" fill="#ffd95a" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="10" fill="#f5a800" />
      <circle cx="12" cy="11" r="10" fill="#ffc933" />
      <circle cx="12" cy="11" r="6.6" fill="#ffdd6e" />
      <path d="M12 6.6l1.3 2.8 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="#f5a800" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="16.5" rx="4" fill="#ffffff" />
      <path d="M3 8.5a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4V10H3z" fill="#ff5d73" />
      <rect x="7" y="2.4" width="2.4" height="5" rx="1.2" fill="#c9cfe0" />
      <rect x="14.6" y="2.4" width="2.4" height="5" rx="1.2" fill="#c9cfe0" />
      <rect x="6.4" y="12.6" width="3.2" height="3.2" rx="1" fill="#d9ddec" />
      <rect x="10.4" y="12.6" width="3.2" height="3.2" rx="1" fill="#7c4dff" />
      <rect x="14.4" y="12.6" width="3.2" height="3.2" rx="1" fill="#d9ddec" />
    </>
  ),
  music: (
    <>
      <path d="M9 5.2l10-2.4v11.4a3.2 3.2 0 1 1-2.4-3.1V6.9L11.4 8v8.4A3.2 3.2 0 1 1 9 13.3z" fill="#7c4dff" />
      <path d="M9 5.2l10-2.4v2.4L9 7.6z" fill="#a98bff" />
    </>
  ),
  musicOff: (
    <>
      <path d="M9 5.2l10-2.4v11.4a3.2 3.2 0 1 1-2.4-3.1V6.9L11.4 8v8.4A3.2 3.2 0 1 1 9 13.3z" fill="#b9bdd0" />
      <path d="M4 4l16 16" stroke="#ff5d73" strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),
  dice: (
    <>
      <rect x="3" y="3.6" width="18" height="18" rx="5" fill="#5a35c9" />
      <rect x="3" y="2.4" width="18" height="18" rx="5" fill="#7c4dff" />
      {[[8, 7.4], [16, 7.4], [12, 11.4], [8, 15.4], [16, 15.4]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.9" fill="#ffffff" />
      ))}
    </>
  ),
  bricks: (
    <>
      <rect x="2.5" y="4" width="9" height="5" rx="1.6" fill="#ff8a5c" />
      <rect x="12.5" y="4" width="9" height="5" rx="1.6" fill="#ff7043" />
      <rect x="2.5" y="10" width="5" height="5" rx="1.6" fill="#ff7043" />
      <rect x="8.5" y="10" width="9" height="5" rx="1.6" fill="#ff8a5c" />
      <rect x="18.5" y="10" width="3" height="5" rx="1.5" fill="#ff7043" />
      <rect x="2.5" y="16" width="9" height="5" rx="1.6" fill="#ff8a5c" />
      <rect x="12.5" y="16" width="9" height="5" rx="1.6" fill="#ff7043" />
      <path d="M4 5.6h6M10 11.6h6M4 17.6h6" stroke="#ffc2a8" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  stones: (
    <>
      <ellipse cx="7" cy="17.6" rx="5" ry="3.6" fill="#8d99b8" />
      <ellipse cx="7" cy="16.6" rx="5" ry="3.6" fill="#c9d2e6" />
      <ellipse cx="15" cy="11.4" rx="4.4" ry="3.2" fill="#8d99b8" />
      <ellipse cx="15" cy="10.4" rx="4.4" ry="3.2" fill="#c9d2e6" />
      <ellipse cx="9.6" cy="5.4" rx="3.6" ry="2.6" fill="#8d99b8" />
      <ellipse cx="9.6" cy="4.6" rx="3.6" ry="2.6" fill="#c9d2e6" />
    </>
  ),
  bolt: (
    <>
      <path d="M13.6 1.6L4.4 13.4h5.8l-1.8 9 9.2-11.8h-5.8z" fill="#ffc21a" />
      <path d="M13.6 1.6L4.4 13.4h5.8l1.6-3.2z" fill="#ffe27a" />
    </>
  ),
  gem: (
    <>
      <path d="M6.4 3.6h11.2L22 9.4 12 21.4 2 9.4z" fill="#2ec4d6" />
      <path d="M6.4 3.6h11.2L22 9.4H2z" fill="#7fe6f0" />
      <path d="M8.6 9.4L12 3.6l3.4 5.8L12 21.4z" fill="#56d6e4" />
      <path d="M8.6 9.4L12 3.6l3.4 5.8z" fill="#c8f6fa" />
    </>
  ),
  cards: (
    <>
      <rect x="9.4" y="3.6" width="11.4" height="15.6" rx="2.6" fill="#7c4dff" transform="rotate(10 15 11.4)" />
      <rect x="3.4" y="4.6" width="11.4" height="15.6" rx="2.6" fill="#ffffff" transform="rotate(-8 9 12.4)" />
      <path d="M8.6 9.6c1-1.4 3-.4 2.4 1.4-.4 1.2-2.4 2.8-2.4 2.8s-2-1.6-2.4-2.8c-.6-1.8 1.4-2.8 2.4-1.4z" fill="#ff5d73" transform="rotate(-8 9 12.4)" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 16.4L15.4 5l3.6 3.6L7.6 20z" fill="#ffc21a" />
      <path d="M4 16.4L15.4 5l1.8 1.8L5.8 18.2z" fill="#ffd95a" />
      <path d="M15.4 5l1.8-1.8a1.6 1.6 0 0 1 2.2 0l1.4 1.4a1.6 1.6 0 0 1 0 2.2L19 8.6z" fill="#ff7a8a" />
      <path d="M4 16.4L3 21l4.6-1z" fill="#3b2f66" />
    </>
  ),
  lock: (
    <>
      <path d="M7.4 10.6V7.8a4.6 4.6 0 0 1 9.2 0v2.8" fill="none" stroke="#b9bdd0" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="4.6" y="10" width="14.8" height="11.4" rx="3.4" fill="#8d92ad" />
      <rect x="4.6" y="10" width="14.8" height="5.6" rx="3.4" fill="#a4a9c0" />
      <circle cx="12" cy="15.4" r="1.8" fill="#ffffff" />
    </>
  ),
  crown: (
    <>
      <path d="M3 8l4.6 4L12 5l4.4 7L21 8l-1.6 10.6H4.6z" fill="#ffc21a" />
      <path d="M3 8l4.6 4L12 5v13.6H4.6z" fill="#ffd95a" />
      <rect x="4.4" y="17.6" width="15.2" height="3" rx="1.5" fill="#f5a800" />
      <circle cx="12" cy="13.6" r="1.6" fill="#ff5d73" />
    </>
  ),
  school: (
    <>
      <path d="M12 3.4L2.6 9.8h18.8z" fill="#ff5d73" />
      <rect x="4.2" y="9.8" width="15.6" height="10.8" rx="1.6" fill="#ffe9b0" />
      <rect x="10" y="14" width="4" height="6.6" rx="1.2" fill="#7c4dff" />
      <rect x="5.8" y="12" width="3" height="3" rx=".8" fill="#5cc8ff" />
      <rect x="15.2" y="12" width="3" height="3" rx=".8" fill="#5cc8ff" />
      <path d="M12 3.4V1.2" stroke="#3b2f66" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M12 1.2l3.4 1.2L12 3.6z" fill="#ffc21a" />
    </>
  ),
  shirt: (
    <>
      <path d="M8 3.4L2.4 6.8l2.2 4.4 2.2-1.2v10.6h10.4V10l2.2 1.2 2.2-4.4L16 3.4a4 4 0 0 1-8 0z" fill="#5cc8ff" />
      <path d="M8 3.4L2.4 6.8l2.2 4.4 2.2-1.2v10.6H12V7.4a4 4 0 0 1-4-4z" fill="#8cdcff" />
    </>
  ),
  adult: (
    <>
      <circle cx="12" cy="8" r="4.6" fill="#ffcf9e" />
      <path d="M7.4 7.2c.4-3 2.2-4.6 4.6-4.6s4.2 1.6 4.6 4.6c-1.6-1-3-1.4-4.6-1.4s-3 .4-4.6 1.4z" fill="#5a3a1e" />
      <path d="M3.6 21.4c.6-4.6 4-7 8.4-7s7.800 2.400 8.400 7z" fill="#7c4dff" />
      <path d="M9.800 14.800L12 18l2.200-3.200" fill="none" stroke="#ffffff" strokeWidth="1.400" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  players: (
    <>
      <circle cx="16.4" cy="8.4" r="3.6" fill="#ffb98a" />
      <path d="M9.800 20.600c.4-4 3-6 6.600-6s6.200 2 6.600 6z" fill="#ff8a5c" />
      <circle cx="8" cy="9" r="4.200" fill="#ffcf9e" />
      <path d="M.800 21.400c.4-4.600 3.200-7 7.200-7s6.800 2.400 7.200 7z" fill="#2ec4d6" />
    </>
  ),
  rocket: (
    <>
      <path d="M9 17.600l-2.200 4 4.200-1.600z" fill="#ffc21a" />
      <path d="M13.800 2.400c4 .2 6.400 2.200 7.800 5.800-1.600 5.200-5.600 8.800-10.400 10.600L6 13.600c1.600-4.800 4-8.800 7.800-11.200z" fill="#f1f3fa" />
      <path d="M13.800 2.400c4 .2 6.400 2.200 7.800 5.800-.6 1.800-1.400 3.400-2.400 4.800L11.400 5c.700-1 1.500-1.800 2.400-2.600z" fill="#ff5d73" />
      <circle cx="13.200" cy="10.400" r="2.400" fill="#5cc8ff" />
      <path d="M6 13.600L2.400 13l3-4 3 1z" fill="#ff8a96" />
      <path d="M11.200 18.800l.600 3.200 4-3-1-3z" fill="#ff8a96" />
    </>
  ),
  book: (
    <>
      <path d="M3 5.400c3-1.200 6-1.200 9 .6v14.600c-3-1.800-6-1.800-9-.6z" fill="#7c4dff" />
      <path d="M21 5.400c-3-1.200-6-1.200-9 .6v14.600c3-1.800 6-1.800 9-.6z" fill="#a98bff" />
      <path d="M5.400 9c1.600-.4 3-.2 4.400.4M5.400 12.400c1.600-.4 3-.2 4.400.4" stroke="#ffffff" strokeWidth="1.200" strokeLinecap="round" opacity=".7" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9.600" fill="#5cc8ff" />
      <path d="M6 7.400c2-.6 3.600.2 4.200 1.800.6 1.800-.6 2.800-1.800 3.800-1 .8-.6 2.600-2 3-1.800-1.200-3-3.200-3-5.600 0-1.200.9-2.300 2.600-3z" fill="#5fd38d" />
      <path d="M14 4.600c2.800.6 5 2.600 5.800 5.400-1.400 1-3 .8-3.800-.4-.8-1.200-2.400-.8-2.800-2.200-.2-1 .2-2 .8-2.800z" fill="#5fd38d" />
      <path d="M13.400 15.400c1.400-.6 3 0 3.600 1.200-1 1.800-2.600 3-4.600 3.400-.4-1.600-.2-3.800 1-4.600z" fill="#5fd38d" />
    </>
  ),
  sound: (
    <>
      <path d="M3 9.400h3.600l5-4.200v13.600l-5-4.200H3z" fill="#ffffff" />
      <path d="M15 8.600a4.800 4.800 0 0 1 0 6.800M17.800 6a8.600 8.600 0 0 1 0 12" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  retry: (
    <>
      <path d="M19.400 12a7.400 7.400 0 1 1-2.400-5.400" fill="none" stroke="currentColor" strokeWidth="2.600" strokeLinecap="round" />
      <path d="M18.600 2.600v5h-5z" fill="currentColor" />
    </>
  ),
  map: (
    <>
      <path d="M3 6l6-2.400 6 2.400 6-2.400V18l-6 2.400L9 18l-6 2.400z" fill="#5fd38d" />
      <path d="M9 3.600l6 2.400v14.400L9 18z" fill="#8ee7aa" />
      <path d="M6 14c1.400-2.600 3.400-1 5-3s3.200-.4 6.400-3.400" fill="none" stroke="#ffffff" strokeWidth="1.600" strokeLinecap="round" strokeDasharray="0.100 3" />
    </>
  ),
  play: <path d="M7 4.200v15.600a1 1 0 0 0 1.500.9l12.400-7.800a1 1 0 0 0 0-1.800L8.500 3.300A1 1 0 0 0 7 4.200z" fill="currentColor" />,
  heart: (
    <>
      <path d="M12 21s-8.6-5.200-8.6-11.400A4.800 4.800 0 0 1 12 6.600a4.800 4.800 0 0 1 8.600 3c0 6.200-8.600 11.400-8.600 11.400z" fill="#ff5d73" />
      <path d="M12 6.600A4.800 4.800 0 0 0 3.400 9.600c0 1.400.4 2.700 1.100 3.900C6 9.800 9 8 12 9z" fill="#ff8a96" />
    </>
  ),
  gift: (
    <>
      <rect x="3.600" y="10" width="16.800" height="11" rx="2.400" fill="#ff5d73" />
      <rect x="2.400" y="6.600" width="19.200" height="4.800" rx="2" fill="#ff8a96" />
      <rect x="10.400" y="6.600" width="3.200" height="14.400" fill="#ffc21a" />
      <path d="M12 6.600C9.600 2.400 5 3.400 6.600 6c.8 1.200 3.600.8 5.400.6zM12 6.600c2.400-4.200 7-3.200 5.400-.6-.8 1.200-3.600.8-5.400.6z" fill="#ffc21a" />
    </>
  ),
}

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" style={{ flex: 'none' }}>
      {ICONS[name]}
    </svg>
  )
}

const KIND: Record<PlayKind, IconName> = { blocks: 'bricks', party: 'dice', arena: 'bolt', bay: 'gem', stones: 'stones', pairs: 'cards', quiz: 'pencil', launch: 'rocket' }

/** The badge of a kind of activity, as it shows on the map and on the briefing. */
export function KindIcon({ kind, size = 40 }: { kind: PlayKind; size?: number }) {
  return <Icon name={KIND[kind]} size={size} />
}
