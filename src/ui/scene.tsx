import type { ReactNode } from 'react'
import type { SceneId } from '../core/worlds'

/**
 * The scenery. Everything is drawn here as layered cut-outs: each strip of ground overlaps the one
 * behind and drops a shadow on it, and the props are shaded with gradients instead of outlines,
 * so the places read as little dioramas rather than flat stickers.
 */

export const SCENE_ICON: Record<SceneId, string> = { beach: '🏖️', jungle: '🌴', mountain: '⛰️', space: '🚀', halloween: '🎃', xmas: '🎄' }

const g = (id: string) => `url(#sg-${id})`
const lin = (id: string, a: string, b: string, horizontal = false) => (
  <linearGradient id={`sg-${id}`} x1="0" y1="0" x2={horizontal ? 1 : 0} y2={horizontal ? 0 : 1}>
    <stop offset="0" stopColor={a} />
    <stop offset="1" stopColor={b} />
  </linearGradient>
)
const ball = (id: string, a: string, b: string, c: string) => (
  <radialGradient id={`sg-${id}`} cx="0.36" cy="0.3" r="0.8">
    <stop offset="0" stopColor={a} />
    <stop offset="0.55" stopColor={b} />
    <stop offset="1" stopColor={c} />
  </radialGradient>
)
const glow = (id: string, color: string, alpha: number) => (
  <radialGradient id={`sg-${id}`}>
    <stop offset="0" stopColor={color} stopOpacity={alpha} />
    <stop offset="1" stopColor={color} stopOpacity="0" />
  </radialGradient>
)

/** Gradients shared by every drawing below. Mounted once, at the top of the app. */
export function SceneDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        {ball('sun', '#fff7b8', '#ffd23f', '#ff9f2e')}
        {glow('sunglow', '#ffe680', 0.7)}
        {glow('white', '#ffffff', 0.9)}
        {glow('gold', '#ffe27a', 0.85)}
        {glow('shade', '#1a0f45', 0.3)}
        {lin('trunk', '#d39a5c', '#8b5a2b', true)}
        {lin('leaf', '#7be08f', '#2a9a57')}
        {lin('leafd', '#3fbf6a', '#1c7a45')}
        {ball('canopy', '#8ee79a', '#3fb265', '#1f7f46')}
        {ball('canopyd', '#5fcf7a', '#2a9a57', '#17683a')}
        {lin('rock', '#cfd6e4', '#8793ab')}
        {lin('rockd', '#8f9bb2', '#5d6884')}
        {lin('snow', '#ffffff', '#d5e3f4')}
        {lin('pine', '#4cc47a', '#1f7a48')}
        {lin('pined', '#2f9a5c', '#14562f')}
        {lin('wood', '#dba76c', '#a36a3a')}
        {lin('woodd', '#b07840', '#7a4a21')}
        {lin('red', '#ff8a96', '#d83a52')}
        {lin('metal', '#ffffff', '#b9c4d8')}
        {lin('sand', '#ffeab5', '#e3b96c')}
        {lin('sail', '#ffffff', '#dfe8f5', true)}
        {lin('blue', '#8fdcff', '#2f8fe8')}
        {lin('flame', '#fff3a0', '#ff7a2e')}
        {lin('purple', '#b79cff', '#5b3fd6')}
        {lin('night', '#5a3d8f', '#2a1b4d')}
        {lin('gold', '#fff0a0', '#ffb400')}
        {lin('pink', '#ffd9e6', '#ff86b3')}
        {ball('planet', '#ffd2b0', '#ff8a5c', '#b9482c')}
        {ball('moon', '#ffffff', '#e3e9f4', '#aab6cc')}
        {ball('cream', '#fffbe0', '#ffe9a0', '#f0c860')}
        {ball('pumpkin', '#ffc070', '#ff8a3c', '#c9541a')}
        {ball('snowball', '#ffffff', '#eef4fb', '#c3d3e8')}
        {ball('coral', '#ff9a8a', '#f2584a', '#b8322c')}
        {ball('window', '#d9f4ff', '#5cc8ff', '#2a7fd0')}
      </defs>
    </svg>
  )
}

const shadow = (rx = 30, cy = 95) => <ellipse cx="50" cy={cy} rx={rx} ry="5" fill={g('shade')} />
const star5 = (cx: number, cy: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2
    const rr = i % 2 ? r * 0.45 : r
    return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`
  }).join(' ')

const pineTree = (snowy: boolean) => (
  <>
    {shadow(24)}
    <rect x="45" y="78" width="10" height="17" rx="2" fill={g('woodd')} />
    {[
      [84, 16, 62],
      [66, 22, 40],
      [42, 28, 12],
    ].map(([base, half, top]) => (
      <g key={base}>
        <path d={`M50 ${top} L${50 + half + 12} ${base} H${50 - half - 12}Z`} fill={g('pine')} />
        <path d={`M50 ${top} L${50 + half + 12} ${base} H50Z`} fill={g('pined')} />
        {snowy ? <path d={`M50 ${top} L${50 + half * 0.5} ${top + (base - top) * 0.34} Q50 ${top + (base - top) * 0.2} ${50 - half * 0.5} ${top + (base - top) * 0.34}Z`} fill={g('snow')} /> : null}
      </g>
    ))}
  </>
)

const cabin = (snowy: boolean) => (
  <>
    {shadow(40)}
    <rect x="20" y="52" width="60" height="42" rx="3" fill={g('wood')} />
    <path d="M20 62 H80 M20 72 H80 M20 82 H80" stroke="#8b5a2b" strokeWidth="1.6" opacity=".45" />
    <rect x="62" y="20" width="10" height="20" fill={g('rockd')} />
    <path d="M10 56 L50 22 L90 56Z" fill={snowy ? g('snow') : g('red')} />
    <path d="M50 22 L90 56 H50Z" fill="#1a0f45" opacity=".12" />
    <rect x="44" y="68" width="14" height="26" rx="3" fill={g('woodd')} />
    <rect x="26" y="64" width="13" height="13" rx="2" fill={g('cream')} />
    <rect x="64" y="64" width="11" height="13" rx="2" fill={g('cream')} />
    <path d="M32.5 64 V77 M26 70.5 H39" stroke="#a36a3a" strokeWidth="1.5" />
  </>
)

/** Props that dress a place. Each fits a 100×100 box and stands on its own shadow. */
const SPRITES: Record<string, ReactNode> = {
  sun: (
    <>
      <circle cx="50" cy="50" r="50" fill={g('sunglow')} />
      <circle cx="50" cy="50" r="26" fill={g('sun')} />
      <ellipse cx="41" cy="40" rx="9" ry="6" fill="#fff" opacity=".45" />
    </>
  ),
  palm: (
    <>
      {shadow(26)}
      <path d="M44 96 C46 72 48 54 54 38 L62 40 C57 56 56 76 58 96Z" fill={g('trunk')} />
      <path d="M45.5 84 L57.5 82 M46.5 72 L57 70 M48 60 L58 58 M50.5 49 L60 47.5" stroke="#7a4a21" strokeWidth="2" opacity=".45" strokeLinecap="round" />
      <g fill={g('leafd')}>
        <path d="M58 38 C36 36 20 46 14 62 C30 48 46 44 58 38Z" />
        <path d="M58 38 C78 36 92 46 96 62 C84 48 70 44 58 38Z" />
        <path d="M58 38 C46 14 28 8 18 12 C36 16 50 26 58 38Z" />
      </g>
      <g fill={g('leaf')}>
        <path d="M58 38 C40 22 22 26 8 40 C28 34 44 38 58 38Z" />
        <path d="M58 38 C74 20 92 24 99 40 C84 32 70 36 58 38Z" />
        <path d="M58 38 C64 14 80 6 92 10 C76 16 66 26 58 38Z" />
      </g>
      <circle cx="54" cy="42" r="5" fill="#7a4a21" />
      <circle cx="61" cy="43" r="4.5" fill="#8b5a2b" />
      <circle cx="52.6" cy="40.6" r="1.6" fill="#fff" opacity=".4" />
    </>
  ),
  parasol: (
    <>
      {shadow(34)}
      <path d="M60 90 L93 83 L97 91 L64 98Z" fill={g('blue')} />
      <path d="M68 88.5 L72 96.5 M79 86 L83 94 M89 84 L93 92" stroke="#fff" strokeWidth="2.4" opacity=".8" />
      <path d="M50 24 L56 94" stroke="#c9a06a" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M8 44 C14 14 86 6 94 34 C80 30 70 34 64 40 C56 32 44 34 38 42 C30 36 18 38 8 44Z" fill={g('red')} />
      <path d="M38 42 C40 26 46 16 54 12 C57 20 61 30 64 40 C56 32 44 34 38 42Z" fill="#fffdf7" />
      <path d="M8 44 C10 34 16 24 26 18 C22 26 20 34 18 39 C14 39.5 11 41.5 8 44Z" fill="#fffdf7" />
      <path d="M78 15 C86 19 92 25 94 34 C89 32.5 85 32 81 32.5 C81 26 80 20 78 15Z" fill="#fffdf7" />
      <path d="M22 22 C40 10 66 8 84 18" fill="none" stroke="#fff" strokeWidth="3" opacity=".3" strokeLinecap="round" />
    </>
  ),
  castle: (
    <>
      {shadow(40)}
      <path d="M18 94 L22 58 H78 L82 94Z" fill={g('sand')} />
      <rect x="12" y="44" width="22" height="50" rx="2" fill={g('sand')} />
      <rect x="66" y="44" width="22" height="50" rx="2" fill={g('sand')} />
      <rect x="38" y="30" width="24" height="42" rx="2" fill={g('sand')} />
      <path d="M12 44 V38 H18 V44 H21 V38 H26 V44 H29 V38 H34 V44Z M66 44 V38 H72 V44 H75 V38 H80 V44 H83 V38 H88 V44Z M38 30 V24 H44 V30 H47 V24 H53 V30 H56 V24 H62 V30Z" fill="#ffeab5" />
      <path d="M43 94 V80 Q50 70 57 80 V94Z" fill="#c99a4e" />
      <path d="M77 44 H88 V94 H80Z M53 30 H62 V58 H56Z" fill="#b98a3e" opacity=".25" />
      <path d="M50 24 V8" stroke="#8b5a2b" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M50 8 L64 13 L50 18Z" fill={g('red')} />
    </>
  ),
  shell: (
    <>
      {shadow(30, 88)}
      <path d="M50 86 C18 86 12 52 30 32 C40 20 60 20 70 32 C88 52 82 86 50 86Z" fill={g('pink')} />
      <path d="M50 84 V28 M50 84 L32 36 M50 84 L68 36 M50 84 L20 56 M50 84 L80 56" stroke="#e66a9c" strokeWidth="2" opacity=".55" strokeLinecap="round" />
      <path d="M30 40 C36 30 44 26 50 26" fill="none" stroke="#fff" strokeWidth="4" opacity=".55" strokeLinecap="round" />
    </>
  ),
  starfish: (
    <>
      {shadow(32, 86)}
      <polygon points={star5(50, 52, 40)} fill={g('coral')} stroke="#f2584a" strokeWidth="9" strokeLinejoin="round" />
      {[[50, 32], [36, 50], [64, 50], [50, 56], [42, 70], [58, 70]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" fill="#ffd0c4" />
      ))}
    </>
  ),
  boat: (
    <>
      <ellipse cx="50" cy="90" rx="44" ry="6" fill="#fff" opacity=".45" />
      <path d="M52 12 V70" stroke="#8b5a2b" strokeWidth="3" strokeLinecap="round" />
      <path d="M56 16 C78 30 84 50 82 66 H56Z" fill={g('sail')} />
      <path d="M48 24 C32 36 24 52 22 66 H48Z" fill="#ffe9a0" />
      <path d="M10 72 H90 L78 90 H24Z" fill={g('red')} />
      <path d="M10 72 H90 L88 76 H12Z" fill="#fff" opacity=".85" />
      <path d="M52 12 L64 8 L52 4Z" fill={g('gold')} />
    </>
  ),
  tree: (
    <>
      {shadow(30)}
      <path d="M44 96 C45 80 44 68 42 58 H58 C56 68 55 80 56 96Z" fill={g('trunk')} />
      <circle cx="30" cy="46" r="22" fill={g('canopyd')} />
      <circle cx="70" cy="46" r="22" fill={g('canopyd')} />
      <circle cx="50" cy="32" r="28" fill={g('canopy')} />
      <circle cx="38" cy="54" r="15" fill={g('canopy')} />
      <circle cx="64" cy="56" r="14" fill={g('canopy')} />
      <circle cx="40" cy="20" r="7" fill="#fff" opacity=".22" />
      <circle cx="58" cy="44" r="3.4" fill={g('coral')} />
      <circle cx="33" cy="44" r="3" fill={g('coral')} />
      <circle cx="70" cy="34" r="3" fill={g('coral')} />
    </>
  ),
  bush: (
    <>
      {shadow(40, 90)}
      <circle cx="28" cy="68" r="22" fill={g('canopyd')} />
      <circle cx="72" cy="68" r="22" fill={g('canopyd')} />
      <circle cx="50" cy="58" r="28" fill={g('canopy')} />
      {[[36, 52], [58, 44], [68, 64], [44, 72], [24, 66]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="5" fill={g('pink')} />
          <circle cx={x} cy={y} r="1.8" fill="#ffd23f" />
        </g>
      ))}
    </>
  ),
  flower: (
    <>
      {shadow(22, 92)}
      <path d="M50 94 C48 80 50 66 50 54" fill="none" stroke="#2a9a57" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 80 C38 78 32 70 32 62 C42 64 48 70 50 80Z M50 74 C62 72 68 64 68 56 C58 58 52 64 50 74Z" fill={g('leaf')} />
      {Array.from({ length: 6 }, (_, i) => (
        <ellipse key={i} cx="50" cy="18" rx="10" ry="15" fill={g('pink')} transform={`rotate(${i * 60} 50 38)`} />
      ))}
      <circle cx="50" cy="38" r="10" fill={g('sun')} />
    </>
  ),
  fern: (
    <>
      {shadow(34, 92)}
      <g fill={g('leafd')}>
        <path d="M50 94 C30 80 12 70 4 44 C26 52 42 66 50 94Z" />
        <path d="M50 94 C70 80 88 70 96 44 C74 52 58 66 50 94Z" />
      </g>
      <g fill={g('leaf')}>
        <path d="M50 94 C36 70 30 40 36 10 C52 36 56 66 50 94Z" />
        <path d="M50 94 C56 72 66 46 84 26 C82 54 70 76 50 94Z" />
        <path d="M50 94 C42 76 30 56 12 30 C18 58 30 78 50 94Z" opacity=".9" />
      </g>
      <path d="M50 90 C44 66 40 40 37 16" fill="none" stroke="#fff" strokeWidth="1.6" opacity=".35" />
    </>
  ),
  mushroom: (
    <>
      {shadow(30, 92)}
      <path d="M40 92 C42 76 42 64 40 54 H60 C58 64 58 76 60 92Z" fill={g('cream')} />
      <path d="M10 58 C10 26 34 12 50 12 C66 12 90 26 90 58 C76 64 24 64 10 58Z" fill={g('coral')} />
      <circle cx="34" cy="34" r="7" fill="#fff" opacity=".92" />
      <circle cx="60" cy="26" r="5.5" fill="#fff" opacity=".92" />
      <circle cx="70" cy="46" r="6" fill="#fff" opacity=".92" />
      <circle cx="46" cy="48" r="4" fill="#fff" opacity=".92" />
      <circle cx="22" cy="50" r="3.6" fill="#fff" opacity=".92" />
    </>
  ),
  peak: (
    <>
      <path d="M2 96 L44 12 L66 50 L76 36 L98 96Z" fill={g('rock')} />
      <path d="M44 12 L66 50 L76 36 L98 96 H54 L48 44Z" fill={g('rockd')} opacity=".7" />
      <path d="M44 12 L30 40 L38 36 L44 46 L50 37 L58 42 L55 31Z" fill={g('snow')} />
      <path d="M76 36 L70 46 L75 44 L79 50 L83 46Z" fill={g('snow')} />
    </>
  ),
  pine: pineTree(false),
  snowpine: pineTree(true),
  cabin: cabin(false),
  snowcabin: cabin(true),
  cloud: (
    <>
      <path d="M22 72 C4 72 4 48 22 48 C22 28 46 24 54 38 C62 28 84 34 82 50 C98 50 98 72 82 72Z" fill={g('snow')} />
      <path d="M26 52 C28 38 42 34 50 42" fill="none" stroke="#fff" strokeWidth="5" opacity=".8" strokeLinecap="round" />
    </>
  ),
  boulder: (
    <>
      {shadow(40, 90)}
      <path d="M10 88 C6 64 20 40 44 36 C70 30 92 52 92 76 C92 84 88 88 84 88Z" fill={g('rock')} />
      <path d="M58 36 C78 38 92 56 92 76 C92 84 88 88 84 88 H62 C72 72 70 50 58 36Z" fill={g('rockd')} opacity=".6" />
      <path d="M24 56 C30 46 40 42 48 42" fill="none" stroke="#fff" strokeWidth="4" opacity=".5" strokeLinecap="round" />
      <path d="M10 88 C12 80 22 78 30 82 C36 78 46 80 48 88Z" fill={g('leaf')} />
    </>
  ),
  planet: (
    <>
      <path d="M6 64 C0 52 30 36 62 34 C86 32 100 40 94 50" fill="none" stroke="#ffd23f" strokeWidth="5" opacity=".9" />
      <circle cx="50" cy="50" r="28" fill={g('planet')} />
      <path d="M25 42 Q50 34 75 44 M24 56 Q50 50 76 58 M32 68 Q50 64 68 70" fill="none" stroke="#ffe0c8" strokeWidth="4" opacity=".55" strokeLinecap="round" />
      <path d="M94 50 C88 62 60 72 32 72 C16 72 8 68 6 64" fill="none" stroke="#ffd23f" strokeWidth="5" />
    </>
  ),
  moon: (
    <>
      <circle cx="50" cy="50" r="48" fill={g('white')} opacity=".35" />
      <circle cx="50" cy="50" r="36" fill={g('moon')} />
      {[[38, 38, 8], [62, 58, 11], [40, 66, 5], [64, 34, 4]].map(([x, y, r]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={r} fill="#aab6cc" />
          <circle cx={x + r * 0.15} cy={y + r * 0.2} r={r * 0.78} fill="#c9d3e3" />
        </g>
      ))}
    </>
  ),
  rocket: (
    <>
      <path d="M40 78 C38 90 44 96 50 100 C56 96 62 90 60 78Z" fill={g('flame')} />
      <path d="M36 56 L18 74 L36 78Z M64 56 L82 74 L64 78Z" fill={g('red')} />
      <path d="M50 2 C72 20 74 54 64 80 H36 C26 54 28 20 50 2Z" fill={g('metal')} />
      <path d="M50 2 C60 10 66 22 68 34 H32 C34 22 40 10 50 2Z" fill={g('red')} />
      <path d="M58 9 C70 24 72 54 64 80 H56 C64 56 64 28 58 9Z" fill="#1a0f45" opacity=".12" />
      <circle cx="50" cy="48" r="10" fill={g('window')} stroke="#fff" strokeWidth="3" />
      <rect x="36" y="74" width="28" height="6" rx="3" fill={g('rockd')} />
    </>
  ),
  star: (
    <>
      <circle cx="50" cy="50" r="50" fill={g('gold')} />
      <polygon points={star5(50, 52, 30)} fill={g('gold')} stroke="#ffe27a" strokeWidth="5" strokeLinejoin="round" />
      <circle cx="43" cy="42" r="4" fill="#fff" opacity=".8" />
    </>
  ),
  ufo: (
    <>
      <path d="M30 62 L16 98 H84 L70 62Z" fill={g('gold')} opacity=".35" />
      <path d="M30 46 C30 20 70 20 70 46Z" fill={g('window')} opacity=".9" />
      <path d="M38 36 C40 28 46 25 52 25" fill="none" stroke="#fff" strokeWidth="3.5" opacity=".7" strokeLinecap="round" />
      <ellipse cx="50" cy="52" rx="46" ry="15" fill={g('metal')} />
      <ellipse cx="50" cy="48" rx="30" ry="7" fill={g('purple')} />
      {[14, 32, 50, 68, 86].map((x) => (
        <circle key={x} cx={x} cy={x === 50 ? 62 : x === 14 || x === 86 ? 54 : 60} r="3.4" fill={g('sun')} />
      ))}
    </>
  ),
  comet: (
    <>
      <path d="M70 30 L4 76 C20 74 40 66 62 46Z" fill={g('gold')} opacity=".6" />
      <path d="M72 34 L10 96 C30 88 50 74 70 50Z" fill={g('blue')} opacity=".45" />
      <circle cx="72" cy="30" r="24" fill={g('white')} opacity=".5" />
      <circle cx="72" cy="30" r="13" fill={g('cream')} />
    </>
  ),
  pumpkin: (
    <>
      {shadow(38, 92)}
      <path d="M48 22 C46 12 50 6 58 4 L61 10 C56 12 55 17 56 23Z" fill={g('leafd')} />
      <ellipse cx="50" cy="58" rx="42" ry="36" fill={g('pumpkin')} />
      <path d="M36 25 C22 40 22 76 36 92 M64 25 C78 40 78 76 64 92 M50 23 V94" fill="none" stroke="#c9541a" strokeWidth="2.4" opacity=".5" />
      <path d="M28 50 L40 42 L42 56Z M72 50 L60 42 L58 56Z" fill="#fff3a0" />
      <path d="M26 66 Q50 90 74 66 L66 70 L62 65 L56 73 L50 67 L44 73 L38 65 L34 70Z" fill="#fff3a0" />
      <ellipse cx="34" cy="38" rx="9" ry="5" fill="#fff" opacity=".3" transform="rotate(-30 34 38)" />
    </>
  ),
  ghost: (
    <>
      {shadow(28, 96)}
      <path d="M18 88 C14 40 24 10 50 10 C76 10 86 40 82 88 C76 82 72 82 66 88 C60 82 56 82 50 88 C44 82 40 82 34 88 C28 82 24 82 18 88Z" fill={g('snow')} />
      <ellipse cx="40" cy="42" rx="5" ry="7" fill="#23164f" />
      <ellipse cx="60" cy="42" rx="5" ry="7" fill="#23164f" />
      <circle cx="41.5" cy="39.5" r="1.8" fill="#fff" />
      <circle cx="61.5" cy="39.5" r="1.8" fill="#fff" />
      <path d="M42 56 Q50 64 58 56" fill="none" stroke="#23164f" strokeWidth="3" strokeLinecap="round" />
      <circle cx="31" cy="54" r="5" fill="#ff9fb5" opacity=".7" />
      <circle cx="69" cy="54" r="5" fill="#ff9fb5" opacity=".7" />
    </>
  ),
  bat: (
    <>
      <path d="M50 52 C40 34 22 30 4 40 C14 42 16 50 14 60 C22 54 28 56 30 66 C36 58 44 58 50 66 C56 58 64 58 70 66 C72 56 78 54 86 60 C84 50 86 42 96 40 C78 30 60 34 50 52Z" fill={g('night')} />
      <path d="M40 40 L38 26 L46 36Z M60 40 L62 26 L54 36Z" fill="#3a2a5c" />
      <circle cx="50" cy="48" r="13" fill="#4a3675" />
      <circle cx="45" cy="46" r="3.4" fill="#fff" />
      <circle cx="55" cy="46" r="3.4" fill="#fff" />
      <circle cx="45.6" cy="46.6" r="1.6" fill="#23164f" />
      <circle cx="55.6" cy="46.6" r="1.6" fill="#23164f" />
      <path d="M46 54 Q50 58 54 54" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  bigmoon: (
    <>
      <circle cx="50" cy="50" r="50" fill={g('gold')} opacity=".6" />
      <circle cx="50" cy="50" r="34" fill={g('cream')} />
      <circle cx="40" cy="40" r="7" fill="#f0c860" opacity=".5" />
      <circle cx="62" cy="58" r="9" fill="#f0c860" opacity=".5" />
      <circle cx="44" cy="64" r="4" fill="#f0c860" opacity=".5" />
    </>
  ),
  spooky: (
    <>
      {shadow(26)}
      <path d="M44 96 C46 76 44 60 40 48 L20 30 L24 26 L42 40 L38 14 L44 12 L50 40 L62 20 L68 23 L56 46 L80 36 L82 42 L58 56 C56 70 56 84 58 96Z" fill={g('night')} />
      <path d="M50 40 L62 20 L68 23 L56 46 L80 36 L82 42 L58 56 C56 70 56 84 58 96 H52 C50 76 52 58 50 40Z" fill="#1a0f45" opacity=".25" />
    </>
  ),
  candy: (
    <>
      {shadow(34, 80)}
      <path d="M30 50 L6 34 L10 50 L6 66Z M70 50 L94 34 L90 50 L94 66Z" fill={g('purple')} />
      <circle cx="50" cy="50" r="24" fill={g('pumpkin')} />
      <path d="M38 30 C48 40 48 60 38 70 M54 27 C64 40 64 60 54 73" fill="none" stroke="#fff" strokeWidth="5" opacity=".75" />
    </>
  ),
  cauldron: (
    <>
      {shadow(38, 94)}
      <circle cx="34" cy="20" r="6" fill="#9cf06a" opacity=".8" />
      <circle cx="58" cy="10" r="4" fill="#9cf06a" opacity=".7" />
      <circle cx="68" cy="24" r="5" fill="#9cf06a" opacity=".8" />
      <path d="M14 44 C10 74 24 94 50 94 C76 94 90 74 86 44Z" fill={g('night')} />
      <ellipse cx="50" cy="42" rx="40" ry="10" fill="#3a2a5c" />
      <ellipse cx="50" cy="42" rx="33" ry="7" fill="#7be05a" />
      <circle cx="40" cy="41" r="4" fill="#b8f58a" />
      <circle cx="60" cy="43" r="3" fill="#b8f58a" />
      <path d="M22 58 C24 70 30 80 38 86" fill="none" stroke="#fff" strokeWidth="4" opacity=".25" strokeLinecap="round" />
    </>
  ),
  xtree: (
    <>
      {shadow(30)}
      <rect x="44" y="80" width="12" height="15" rx="2" fill={g('woodd')} />
      {[
        [86, 34, 58],
        [66, 27, 38],
        [46, 20, 16],
      ].map(([base, half, top]) => (
        <g key={base}>
          <path d={`M50 ${top} L${50 + half} ${base} Q50 ${base + 6} ${50 - half} ${base}Z`} fill={g('pine')} />
          <path d={`M50 ${top} L${50 + half} ${base} Q${50 + half * 0.5} ${base + 4} 50 ${base + 3}Z`} fill={g('pined')} />
          <path d={`M${50 - half} ${base} Q50 ${base + 7} ${50 + half} ${base} Q50 ${base - 3} ${50 - half} ${base}Z`} fill="#fff" opacity=".9" />
        </g>
      ))}
      {[[40, 50, 'red'], [60, 56, 'gold'], [34, 76, 'gold'], [52, 72, 'blue'], [68, 78, 'red'], [50, 34, 'blue']].map(([x, y, c]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill={g(c as string)} />
      ))}
      <polygon points={star5(50, 12, 10)} fill={g('gold')} />
    </>
  ),
  snowman: (
    <>
      {shadow(30)}
      <circle cx="50" cy="72" r="24" fill={g('snowball')} />
      <circle cx="50" cy="38" r="17" fill={g('snowball')} />
      <path d="M34 48 C42 54 58 54 66 48 L68 54 C58 60 42 60 32 54Z" fill={g('red')} />
      <path d="M60 54 L66 72 L58 72 L56 56Z" fill={g('red')} />
      <rect x="37" y="10" width="26" height="15" rx="2" fill="#2b2d42" />
      <rect x="31" y="22" width="38" height="5" rx="2.5" fill="#2b2d42" />
      <rect x="37" y="19" width="26" height="3.5" fill={g('red')} />
      <circle cx="44" cy="35" r="2.4" fill="#23164f" />
      <circle cx="56" cy="35" r="2.4" fill="#23164f" />
      <path d="M50 39 L64 43 L50 45Z" fill="#ff8a3c" />
      <circle cx="50" cy="64" r="2.4" fill="#23164f" />
      <circle cx="50" cy="76" r="2.4" fill="#23164f" />
    </>
  ),
  gift: (
    <>
      {shadow(36, 92)}
      <rect x="16" y="46" width="68" height="46" rx="4" fill={g('red')} />
      <rect x="10" y="34" width="80" height="16" rx="4" fill="#ff8a96" />
      <rect x="43" y="34" width="14" height="58" fill={g('gold')} />
      <path d="M50 34 C36 14 16 18 26 32 C32 38 44 36 50 34Z M50 34 C64 14 84 18 74 32 C68 38 56 36 50 34Z" fill={g('gold')} />
      <path d="M60 50 H84 V92 H66 C72 78 70 62 60 50Z" fill="#1a0f45" opacity=".12" />
    </>
  ),
  cane: (
    <>
      {shadow(22, 94)}
      <path d="M44 92 V36 C44 14 78 14 78 38" fill="none" stroke="#fff" strokeWidth="13" strokeLinecap="round" />
      <path d="M44 92 V36 C44 14 78 14 78 38" fill="none" stroke="#e8375a" strokeWidth="13" strokeLinecap="butt" strokeDasharray="9 11" />
      <path d="M40.5 88 V36 C40.5 22 52 16 60 17" fill="none" stroke="#fff" strokeWidth="2.4" opacity=".6" strokeLinecap="round" />
    </>
  ),
  snowflake: (
    <g stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity=".92">
      {[0, 60, 120].map((r) => (
        <path key={r} d="M50 10 V90 M50 24 L40 14 M50 24 L60 14 M50 76 L40 86 M50 76 L60 86" transform={`rotate(${r} 50 50)`} />
      ))}
    </g>
  ),
}

export function Sprite({ name, size }: { name: string; size: number }) {
  return (
    <svg className="sprite" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {SPRITES[name]}
    </svg>
  )
}

// ───────────── Ground ─────────────

interface Strip {
  /** Where its top edge sits, from 0 (top) to 1 (bottom). */
  at: number
  fill: [string, string]
  /** Height of its waves in px, and how many fit across. */
  amp?: number
  waves?: number
  /** Colour of the lit edge of the cut-out. */
  edge?: string
}
interface Ground {
  back: [string, string]
  strips: Strip[]
}

/** The long strips of the map: what the trail crosses in each place, top (far) to bottom (near). */
const TRAIL: Record<SceneId, Ground> = {
  beach: {
    back: ['#b9dc86', '#d8e296'],
    strips: [
      { at: 0.07, fill: ['#f2e3a0', '#f7dd96'], amp: 12, waves: 1.3 },
      { at: 0.3, fill: ['#f9dd92', '#f3cf7c'], amp: 14, waves: 0.9 },
      { at: 0.55, fill: ['#f3cd7a', '#e9bd66'], amp: 12, waves: 1.6 },
      { at: 0.76, fill: ['#e3b862', '#d9aa58'], amp: 9, waves: 2.2 },
      { at: 0.845, fill: ['#ffffff', '#dff7fb'], amp: 7, waves: 3.1, edge: '#ffffff' },
      { at: 0.865, fill: ['#8fe6ea', '#4cc4de'], amp: 7, waves: 3.1 },
      { at: 0.93, fill: ['#3aa9dc', '#2b7fc6'], amp: 6, waves: 2.3 },
    ],
  },
  jungle: {
    back: ['#268a4c', '#2f9d57'],
    strips: [
      { at: 0.1, fill: ['#3aaa5f', '#319a55'], amp: 16, waves: 1.2 },
      { at: 0.3, fill: ['#47b86a', '#3ba55d'], amp: 14, waves: 1.8 },
      { at: 0.475, fill: ['#bff0f5', '#7fd6ea'], amp: 8, waves: 2.4, edge: '#ffffff' },
      { at: 0.49, fill: ['#6fd0ea', '#3fb0dc'], amp: 8, waves: 2.4 },
      { at: 0.545, fill: ['#58c873', '#47b464'], amp: 9, waves: 2.1 },
      { at: 0.72, fill: ['#74d27c', '#5fc06c'], amp: 14, waves: 1.1 },
      { at: 0.9, fill: ['#9cd980', '#b9dc86'], amp: 12, waves: 1.7 },
    ],
  },
  mountain: {
    back: ['#f4f8fd', '#e6eef8'],
    strips: [
      { at: 0.1, fill: ['#ffffff', '#dbe6f3'], amp: 18, waves: 1.4 },
      { at: 0.27, fill: ['#d3deec', '#bccadd'], amp: 20, waves: 2.2 },
      { at: 0.44, fill: ['#aab6ca', '#96a3b9'], amp: 22, waves: 1.6 },
      { at: 0.6, fill: ['#8a96ae', '#7b88a1'], amp: 18, waves: 2.6 },
      { at: 0.76, fill: ['#7cc98a', '#62b673'], amp: 14, waves: 1.3 },
      { at: 0.91, fill: ['#3fae62', '#268a4c'], amp: 12, waves: 2 },
    ],
  },
  space: {
    back: ['#120c38', '#1a1250'],
    strips: [
      { at: 0.3, fill: ['#221866', '#2a1f7a'], amp: 26, waves: 0.8, edge: 'rgba(160,140,255,.35)' },
      { at: 0.52, fill: ['#33279a', '#4335b4'], amp: 22, waves: 1.3, edge: 'rgba(170,160,255,.4)' },
      { at: 0.7, fill: ['#5f52cc', '#8478e6'], amp: 18, waves: 1.1, edge: 'rgba(210,200,255,.5)' },
      { at: 0.82, fill: ['#a5b4f6', '#cfe0ff'], amp: 14, waves: 1.7 },
      { at: 0.915, fill: ['#ffffff', '#f4f8fd'], amp: 12, waves: 2.6 },
    ],
  },
  halloween: {
    back: ['#24163f', '#3a2160'],
    strips: [
      { at: 0.24, fill: ['#4a2b78', '#5b3389'], amp: 20, waves: 1.1, edge: 'rgba(200,150,255,.35)' },
      { at: 0.46, fill: ['#6d3a8a', '#8a4580'], amp: 18, waves: 1.7, edge: 'rgba(255,170,220,.3)' },
      { at: 0.64, fill: ['#c2602f', '#a84a26'], amp: 14, waves: 1.3, edge: 'rgba(255,200,120,.5)' },
      { at: 0.82, fill: ['#8f3f24', '#73301e'], amp: 12, waves: 2.1, edge: 'rgba(255,170,100,.4)' },
    ],
  },
  xmas: {
    back: ['#17305f', '#24498a'],
    strips: [
      { at: 0.22, fill: ['#2f66a8', '#3f7dbd'], amp: 22, waves: 0.9, edge: 'rgba(150,255,220,.45)' },
      { at: 0.42, fill: ['#cfe3f7', '#b5d0ec'], amp: 18, waves: 1.5 },
      { at: 0.6, fill: ['#eef5fd', '#d5e5f6'], amp: 16, waves: 1.1 },
      { at: 0.8, fill: ['#ffffff', '#e3eefa'], amp: 12, waves: 2 },
    ],
  },
}

/** The view behind a game: sky above, a few hills along the bottom. */
const VIEW: Record<SceneId, Ground> = {
  beach: {
    back: ['#7fd4ff', '#d9f4ff'],
    strips: [
      { at: 0.6, fill: ['#5fcbe6', '#3aa9dc'], amp: 5, waves: 3.2 },
      { at: 0.7, fill: ['#ffffff', '#e3f8fb'], amp: 6, waves: 2.6, edge: '#ffffff' },
      { at: 0.715, fill: ['#fbe3a0', '#f3cf7c'], amp: 6, waves: 2.6 },
      { at: 0.86, fill: ['#f3cd7a', '#e3b862'], amp: 10, waves: 1.3 },
    ],
  },
  jungle: {
    back: ['#9fe6c0', '#dff7d8'],
    strips: [
      { at: 0.5, fill: ['#3aaa5f', '#2f9d57'], amp: 22, waves: 1.9 },
      { at: 0.66, fill: ['#58c873', '#47b464'], amp: 16, waves: 1.3 },
      { at: 0.84, fill: ['#86da84', '#6cc874'], amp: 10, waves: 2.3 },
    ],
  },
  mountain: {
    back: ['#9fd6ff', '#e9f5ff'],
    strips: [
      { at: 0.46, fill: ['#eef4fb', '#c9d6e6'], amp: 30, waves: 2.6 },
      { at: 0.62, fill: ['#aab6ca', '#8a96ae'], amp: 22, waves: 1.7 },
      { at: 0.8, fill: ['#7cc98a', '#55ac68'], amp: 12, waves: 1.3 },
    ],
  },
  space: {
    back: ['#120c38', '#3a2c94'],
    strips: [
      { at: 0.62, fill: ['#5f52cc', '#4335b4'], amp: 14, waves: 1.2, edge: 'rgba(210,200,255,.5)' },
      { at: 0.78, fill: ['#c9d3e6', '#9aa6c2'], amp: 10, waves: 2.2 },
      { at: 0.9, fill: ['#e9eef7', '#b9c4d8'], amp: 8, waves: 1.5 },
    ],
  },
  halloween: {
    back: ['#24163f', '#7a3d86'],
    strips: [
      { at: 0.56, fill: ['#4a2b78', '#3a2160'], amp: 20, waves: 1.6, edge: 'rgba(200,150,255,.35)' },
      { at: 0.72, fill: ['#c2602f', '#a84a26'], amp: 12, waves: 1.2, edge: 'rgba(255,200,120,.5)' },
      { at: 0.88, fill: ['#8f3f24', '#6b2c1c'], amp: 9, waves: 2.2 },
    ],
  },
  xmas: {
    back: ['#17305f', '#4f8fd0'],
    strips: [
      { at: 0.54, fill: ['#cfe3f7', '#a9c8e8'], amp: 22, waves: 1.5 },
      { at: 0.7, fill: ['#eef5fd', '#d5e5f6'], amp: 14, waves: 1.1 },
      { at: 0.86, fill: ['#ffffff', '#e3eefa'], amp: 9, waves: 2.1 },
    ],
  },
}

const edgePath = (y0: number, amp: number, waves: number, phase: number) => {
  const pts: string[] = []
  for (let x = 0; x <= 100; x += 2) {
    const a = (2 * Math.PI * waves * x) / 100 + phase
    pts.push(`${x},${(y0 + amp * Math.sin(a) + amp * 0.35 * Math.sin(a * 2.3 + phase)).toFixed(1)}`)
  }
  return pts
}

/** Strips of ground as overlapping cut-outs. Drawn to the pixel height given, stretched to any width. */
export function Terrain({ scene, height, view }: { scene: SceneId; height: number; view?: boolean }) {
  const ground = (view ? VIEW : TRAIL)[scene]
  const id = `${view ? 'v' : 't'}-${scene}`
  return (
    <svg className="terrain" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ground.back[0]} />
          <stop offset="1" stopColor={ground.back[1]} />
        </linearGradient>
        {ground.strips.map((s, i) => (
          <linearGradient key={i} id={`${id}-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={s.fill[0]} />
            <stop offset="1" stopColor={s.fill[1]} />
          </linearGradient>
        ))}
      </defs>
      <rect width="100" height={height} fill={`url(#${id}-b)`} />
      {ground.strips.map((s, i) => {
        const next = ground.strips[i + 1]?.at ?? 1
        const top = s.at * height
        const pts = edgePath(top, s.amp ?? 10, s.waves ?? 1.5, i * 1.9 + scene.length)
        // Each strip only needs to reach a little under the next one's edge.
        const bottom = Math.min(height, next * height + 60)
        const body = `M${pts.join(' L')} L100,${bottom} L0,${bottom}Z`
        return (
          <g key={i}>
            <path d={body} fill="#1a0f45" opacity=".1" transform="translate(0 -9)" />
            <path d={body} fill="#1a0f45" opacity=".12" transform="translate(0 -4)" />
            <path d={body} fill={`url(#${id}-${i})`} />
            <polyline points={pts.join(' ')} fill="none" stroke={s.edge ?? 'rgba(255,255,255,.45)'} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          </g>
        )
      })}
    </svg>
  )
}

/** Where each prop stands along a place's trail: [name, left %, top %, size px]. */
export const TRAIL_PROPS: Record<SceneId, [string, number, number, number][]> = {
  beach: [['sun', 76, 2, 110], ['palm', 2, 12, 130], ['starfish', 82, 30, 46], ['parasol', 70, 44, 112], ['castle', 6, 56, 92], ['shell', 84, 66, 44], ['palm', 74, 70, 104], ['boat', 8, 87, 84], ['boat', 70, 92, 58]],
  jungle: [['tree', 0, 3, 132], ['flower', 84, 13, 60], ['fern', 74, 27, 104], ['mushroom', 10, 36, 54], ['bush', 2, 52, 96], ['tree', 72, 56, 140], ['flower', 14, 71, 54], ['fern', 78, 83, 90], ['tree', 2, 84, 116]],
  mountain: [['cloud', 68, 2, 120], ['peak', -4, 9, 190], ['snowpine', 80, 28, 84], ['cabin', 6, 38, 92], ['peak', 60, 46, 170], ['boulder', 12, 62, 64], ['pine', 78, 70, 88], ['cloud', 2, 76, 96], ['pine', 14, 87, 78], ['pine', 80, 90, 70]],
  space: [['rocket', 74, 4, 100], ['star', 10, 9, 44], ['planet', 0, 22, 132], ['comet', 70, 30, 96], ['ufo', 8, 46, 92], ['moon', 70, 52, 112], ['star', 84, 72, 36], ['star', 12, 68, 34], ['cloud', 0, 88, 124], ['cloud', 68, 92, 110]],
  halloween: [['bigmoon', 66, 2, 130], ['bat', 8, 8, 64], ['spooky', 0, 22, 130], ['bat', 76, 30, 50], ['ghost', 78, 44, 70], ['cauldron', 6, 56, 76], ['pumpkin', 76, 66, 84], ['candy', 12, 76, 50], ['pumpkin', 4, 86, 66], ['spooky', 74, 84, 96]],
  xmas: [['star', 78, 2, 60], ['snowflake', 10, 6, 40], ['snowpine', 0, 18, 110], ['snowflake', 82, 22, 30], ['snowcabin', 68, 34, 110], ['xtree', 4, 46, 104], ['snowman', 76, 58, 86], ['gift', 10, 70, 60], ['cane', 82, 78, 56], ['snowpine', 2, 84, 90], ['gift', 70, 90, 50]],
}

/** Props along the bottom of the view behind a game: [name, left %, bottom px, size px]. */
const VIEW_PROPS: Record<SceneId, [string, number, number, number][]> = {
  beach: [['sun', 72, 520, 120], ['palm', -6, 40, 170], ['boat', 62, 250, 70], ['parasol', 70, 20, 130]],
  jungle: [['tree', -8, 60, 190], ['tree', 72, 90, 170], ['fern', 60, 0, 110], ['bush', 6, 0, 100]],
  mountain: [['cloud', 62, 520, 130], ['peak', -10, 170, 250], ['peak', 56, 200, 220], ['pine', 4, 30, 110], ['cabin', 70, 30, 110]],
  space: [['planet', -4, 480, 140], ['star', 78, 560, 50], ['moon', 66, 300, 120], ['rocket', 4, 60, 110], ['ufo', 68, 80, 100]],
  halloween: [['bigmoon', 60, 480, 150], ['bat', 8, 520, 70], ['spooky', -8, 80, 190], ['pumpkin', 70, 20, 110], ['ghost', 64, 200, 70]],
  xmas: [['star', 74, 560, 60], ['snowflake', 10, 520, 44], ['snowpine', -6, 70, 160], ['snowcabin', 60, 110, 130], ['snowman', 72, 10, 100], ['gift', 8, 6, 70]],
}

/** The view behind a game or a card: a whole little landscape filling its parent. */
export function Backdrop({ scene }: { scene: SceneId }) {
  return (
    <div className={`backdrop scene-${scene}`} aria-hidden="true">
      <Terrain scene={scene} height={780} view />
      {VIEW_PROPS[scene].map(([name, left, bottom, size], i) => (
        <span key={i} className="backdrop-prop" style={{ left: `${left}%`, bottom: `${(bottom / 780) * 100}%` }}>
          <Sprite name={name} size={size} />
        </span>
      ))}
      <i className="grain" />
    </div>
  )
}
