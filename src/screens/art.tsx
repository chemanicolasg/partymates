import type { ReactNode } from 'react'
import type { Kind, ZoneId } from '../core/types'

/** Icon of each kind of activity, shown on the map so children see the variety ahead. */
export const KIND_ICON: Record<Kind, string> = { blocks: '🧱', party: '🎲', arena: '⚡', bay: '💎', stones: '👣', pairs: '🃏' }
/** Three pictograms per activity for the "how to play" strip. */
export const HOW_ICONS: Record<Kind, [string, string, string]> = {
  blocks: ['🧱', '🔨', '🚩'],
  party: ['🎲', '🧮', '📍'],
  arena: ['👀', '🃏', '💥'],
  bay: ['💎', '🤝', '✔️'],
  stones: ['🔢', '👆', '🏁'],
  pairs: ['🧮', '👉', '🔗'],
}
export const ZONE_ICON: Record<ZoneId, string> = { beach: '🏖️', jungle: '🌴', mountain: '⛰️', space: '🚀' }

const INK = '#23164f'
const o = { stroke: INK, strokeWidth: 2.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }

/** Small vector drawings that dress the map. Each fits a 100×100 box. */
const DECOR: Record<string, ReactNode> = {
  sun: (
    <>
      {Array.from({ length: 10 }, (_, i) => (
        <path key={i} d="M50 6 V18" {...o} stroke="#ffb347" strokeWidth="6" transform={`rotate(${i * 36} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="24" fill="#ffd23f" {...o} />
    </>
  ),
  palm: (
    <>
      <path d="M46 96 C48 70 50 52 56 38 L62 40 C56 56 56 74 58 96Z" fill="#b8793e" {...o} />
      <g fill="#3fbf6a" {...o}>
        <path d="M58 38 C40 22 22 26 10 38 C28 34 44 38 58 38Z" />
        <path d="M58 38 C74 20 92 24 98 38 C84 32 70 36 58 38Z" />
        <path d="M58 38 C46 14 28 8 18 12 C36 16 50 26 58 38Z" />
        <path d="M58 38 C64 14 80 6 92 10 C76 16 66 26 58 38Z" />
      </g>
      <circle cx="55" cy="42" r="5" fill="#8b5a2b" {...o} />
    </>
  ),
  shell: <path d="M50 84 C20 84 14 52 30 34 C40 22 60 22 70 34 C86 52 80 84 50 84Z M50 84 V30 M50 84 L32 40 M50 84 L68 40" fill="#ffc2d6" {...o} />,
  wave: <path d="M2 60 C14 40 26 40 38 60 C50 80 62 80 74 60 C82 46 90 44 98 52" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".7" />,
  tree: (
    <>
      <rect x="44" y="58" width="12" height="38" rx="4" fill="#8b5a2b" {...o} />
      <circle cx="50" cy="40" r="30" fill="#2fa862" {...o} />
      <circle cx="38" cy="32" r="8" fill="#5fd38d" opacity=".7" />
    </>
  ),
  leaf: <path d="M12 88 C10 40 44 10 90 12 C92 58 62 92 12 88Z M12 88 L70 30" fill="#5fd38d" {...o} />,
  flower: (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <ellipse key={i} cx="50" cy="24" rx="12" ry="18" fill="#ff8fb8" {...o} transform={`rotate(${i * 60} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="12" fill="#ffd23f" {...o} />
    </>
  ),
  peak: (
    <>
      <path d="M4 96 L44 14 L66 52 L76 38 L98 96Z" fill="#8f9bb0" {...o} />
      <path d="M44 14 L33 37 L42 33 L48 41 L55 33Z" fill="#fff" {...o} />
    </>
  ),
  pine: (
    <>
      <rect x="45" y="78" width="10" height="18" rx="3" fill="#8b5a2b" {...o} />
      <path d="M50 6 L74 40 H62 L80 66 H66 L84 86 H16 L34 66 H20 L38 40 H26Z" fill="#2f8f5b" {...o} />
    </>
  ),
  cloud: <path d="M22 70 C6 70 6 48 22 48 C22 30 46 26 54 40 C62 30 82 36 80 50 C96 50 96 70 80 70Z" fill="#fff" {...o} opacity=".95" />,
  planet: (
    <>
      <ellipse cx="50" cy="52" rx="46" ry="12" fill="none" {...o} stroke="#ffd23f" strokeWidth="5" transform="rotate(-18 50 52)" />
      <circle cx="50" cy="50" r="27" fill="#ff8a5c" {...o} />
      <path d="M26 44 Q50 36 74 46 M28 58 Q50 52 72 60" fill="none" stroke="#ffc09c" strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  star: <path d="M50 8 L61 38 L92 40 L67 60 L76 90 L50 72 L24 90 L33 60 L8 40 L39 38Z" fill="#ffd23f" {...o} />,
  rocket: (
    <>
      <path d="M38 78 L32 96 L50 86 L68 96 L62 78Z" fill="#ff9f43" {...o} />
      <path d="M50 4 C70 20 72 54 64 80 H36 C28 54 30 20 50 4Z" fill="#f3f5fa" {...o} />
      <path d="M36 56 L20 72 L34 74Z M64 56 L80 72 L66 74Z" fill="#ff4d6d" {...o} />
      <circle cx="50" cy="40" r="10" fill="#5cc8ff" {...o} />
    </>
  ),
  moon: (
    <>
      <circle cx="50" cy="50" r="38" fill="#e9eef7" {...o} />
      <circle cx="38" cy="38" r="8" fill="#c7d0e0" />
      <circle cx="62" cy="58" r="11" fill="#c7d0e0" />
      <circle cx="40" cy="66" r="5" fill="#c7d0e0" />
    </>
  ),
}

/** Where each drawing sits in a zone: [name, left %, top %, size px]. */
export const ZONE_DECOR: Record<ZoneId, [string, number, number, number][]> = {
  beach: [['sun', 78, 4, 96], ['palm', 4, 16, 120], ['shell', 80, 36, 46], ['palm', 76, 50, 110], ['shell', 10, 62, 40], ['wave', 6, 84, 110], ['wave', 62, 90, 120], ['wave', 30, 95, 90]],
  jungle: [['tree', 2, 6, 120], ['flower', 84, 16, 52], ['leaf', 76, 34, 100], ['tree', 74, 58, 130], ['leaf', 4, 46, 90], ['flower', 12, 72, 48], ['tree', 4, 84, 110]],
  mountain: [['cloud', 70, 4, 110], ['peak', 0, 14, 170], ['pine', 80, 36, 80], ['peak', 62, 52, 150], ['pine', 8, 60, 76], ['cloud', 6, 40, 90], ['pine', 78, 82, 84], ['pine', 16, 88, 70]],
  space: [['rocket', 76, 6, 90], ['star', 12, 10, 34], ['planet', 2, 26, 120], ['star', 82, 34, 28], ['moon', 72, 52, 100], ['star', 14, 60, 30], ['star', 86, 76, 26], ['cloud', 2, 88, 110], ['cloud', 70, 93, 100]],
}

export function Decor({ name, size }: { name: string; size: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {DECOR[name]}
    </svg>
  )
}
