import type { CSSProperties, ReactNode } from 'react'
import { useSeason } from '../core/store'

/**
 * Matty, the mascot: a small astronaut with a teal face behind a round visor, sun-yellow gloves,
 * boots and ear-pods, and an antenna tipped with the brand's four-pointed sparkle.
 *
 * Everything is a handful of vector shapes on one canvas, so the same drawing serves the app,
 * print and animation. The palette and proportions are documented in brand/README.md —
 * change them there and here together.
 */
export const MATTY = {
  ink: '#23164f',
  face: 'var(--m-face, #35c9b8)',
  suit: 'var(--m-suit, #f7f9fc)',
  shade: 'var(--m-shade, #c7d0e0)',
  accent: 'var(--m-accent, #ffd23f)',
  panel: 'var(--m-panel, #e6fff7)',
  cheek: 'var(--m-cheek, #ff9fb5)',
  mouth: '#7a1f3d',
} as const

export type MattyPose = 'hi' | 'happy' | 'cheer' | 'think' | 'oops' | 'gift' | 'wow' | 'point'

const line = { stroke: MATTY.ink, strokeWidth: 2.6, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
const thin = { ...line, strokeWidth: 2 }

/** The four-pointed "plus" sparkle that follows Matty around: the brand's small motif. */
export function Sparkle({ x, y, size, fill = '#ffd23f' }: { x: number; y: number; size: number; fill?: string }) {
  const a = size
  const b = size * 0.28
  return (
    <path
      d={`M${x} ${y - a} L${x + b} ${y - b} L${x + a} ${y} L${x + b} ${y + b} L${x} ${y + a} L${x - b} ${y + b} L${x - a} ${y} L${x - b} ${y - b}Z`}
      fill={fill}
      {...thin}
      strokeWidth={1.6}
    />
  )
}

/** Backpack, boots and the suit, up to the collar. */
function Suit() {
  return (
    <>
      <rect x="23" y="65" width="54" height="31" rx="10" fill={MATTY.shade} {...line} />
      <ellipse cx="39" cy="102.5" rx="10" ry="5.6" fill={MATTY.accent} {...line} />
      <ellipse cx="61" cy="102.5" rx="10" ry="5.6" fill={MATTY.accent} {...line} />
      <path d="M30 68 C30 59 70 59 70 68 L73 91 C73 101 27 101 27 91Z" fill={MATTY.suit} {...line} />
      <rect x="40.5" y="77" width="19" height="13" rx="3.5" fill={MATTY.panel} {...thin} />
      <Sparkle x={50} y={83.5} size={4.6} />
      <ellipse cx="50" cy="69.5" rx="17.5" ry="4.6" fill={MATTY.shade} {...line} />
    </>
  )
}

/** Helmet with its ear-pods and antenna; the visor frames the face. */
function Helmet() {
  return (
    <>
      <path d="M62.5 12.5 L69 1.5" fill="none" {...line} />
      <Sparkle x={70} y={-0.5} size={5.6} />
      <rect x="13.5" y="33" width="10" height="18" rx="5" fill={MATTY.accent} {...line} />
      <rect x="76.5" y="33" width="10" height="18" rx="5" fill={MATTY.accent} {...line} />
      <circle cx="50" cy="41" r="31" fill={MATTY.suit} {...line} />
      <ellipse cx="50" cy="43" rx="24.5" ry="21.5" fill={MATTY.face} {...line} />
    </>
  )
}

function Face({ pose }: { pose: MattyPose }) {
  const closed = pose === 'cheer'
  const big = pose === 'wow'
  return (
    <>
      {/* The face is drawn large and then fitted inside the visor. */}
      <g transform="translate(50 43) scale(.84) translate(-50 -56)">
        <circle cx="27" cy="62" r="5.6" fill={MATTY.cheek} opacity=".9" />
        <circle cx="73" cy="62" r="5.6" fill={MATTY.cheek} opacity=".9" />
        {closed ? (
          <g fill="none" {...line} strokeWidth={3}>
            <path d="M31.5 53.5 Q37 45.5 42.5 53.5" />
            <path d="M57.5 53.5 Q63 45.5 68.5 53.5" />
          </g>
        ) : (
          <g className="matty-eyes">
            <ellipse cx="37" cy="52" rx={big ? 6.4 : 5.6} ry={big ? 7.8 : 7.2} fill={MATTY.ink} />
            <ellipse cx="63" cy="52" rx={big ? 6.4 : 5.6} ry={big ? 7.8 : 7.2} fill={MATTY.ink} />
            {/* Looking up and to the side while thinking. */}
            <g fill="#fff" transform={pose === 'think' ? 'translate(2.2 -1.6)' : undefined}>
              <circle cx="35.2" cy="49.2" r="2.2" />
              <circle cx="61.2" cy="49.2" r="2.2" />
              <circle cx="38.8" cy="54.8" r="1" />
              <circle cx="64.8" cy="54.8" r="1" />
            </g>
          </g>
        )}
        {pose === 'oops' ? (
          <g fill="none" {...thin}>
            <path d="M31 44.5 L41 41.5" />
            <path d="M69 44.5 L59 41.5" />
          </g>
        ) : null}
        {pose === 'think' ? <path d="M57.5 41.5 Q63 37.5 68.5 41" fill="none" {...thin} /> : null}

        {pose === 'hi' || pose === 'cheer' || pose === 'gift' ? (
          <>
            <path d="M43.5 61 Q50 72.5 56.5 61Z" fill={MATTY.mouth} {...thin} />
            <ellipse cx="50" cy="66.4" rx="3.1" ry="1.9" fill={MATTY.cheek} />
          </>
        ) : pose === 'think' ? (
          <path d="M46 64.5 Q50 62.8 54 65" fill="none" {...line} />
        ) : pose === 'oops' ? (
          <path d="M45 65 Q47.5 62 50 64.5 Q52.5 67 55 64" fill="none" {...line} />
        ) : pose === 'wow' ? (
          <ellipse cx="50" cy="65.5" rx="3.3" ry="4.2" fill={MATTY.mouth} {...thin} />
        ) : (
          <path d="M44.5 61.5 Q50 68.5 55.5 61.5" fill="none" {...line} />
        )}
      </g>
      {/* Reflection on the glass. */}
      <path d="M31.5 35 Q35 26 43.5 23.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".7" />
      <circle cx="30.2" cy="40.5" r="1.5" fill="#fff" opacity=".7" />
    </>
  )
}

/** A sleeve with its glove. `hand` says which end of the sleeve the glove is on. */
const arm = (cx: number, cy: number, rot: number, hand: 1 | -1) => (
  <g transform={`rotate(${rot} ${cx} ${cy})`}>
    <ellipse cx={cx} cy={cy} rx="5.6" ry="9.4" fill={MATTY.suit} {...line} />
    <ellipse cx={cx} cy={cy + hand * 5.6} rx="5.6" ry="4.6" fill={MATTY.accent} {...line} />
  </g>
)
const leftDown = arm(21.5, 81, 22, 1)
const rightDown = arm(78.5, 81, -22, 1)

function Arms({ pose }: { pose: MattyPose }) {
  switch (pose) {
    case 'hi':
      return (
        <>
          {leftDown}
          {arm(86, 61, 35, -1)}
          <path d="M96 44 Q99 47 98 51 M100.5 50 Q103 53 101.5 57" fill="none" {...thin} strokeWidth={1.6} />
        </>
      )
    case 'cheer':
      return (
        <>
          {arm(14, 61, -35, -1)}
          {arm(86, 61, 35, -1)}
          <Sparkle x={3} y={36} size={6} />
          <Sparkle x={97} y={30} size={7.5} fill="#ff4d6d" />
        </>
      )
    case 'think':
      return (
        <>
          {leftDown}
          {arm(68, 78, -52, -1)}
          <Sparkle x={93} y={16} size={8} />
        </>
      )
    case 'point':
      return (
        <>
          {leftDown}
          {arm(87, 77, -80, 1)}
        </>
      )
    case 'wow':
      return (
        <>
          {arm(14, 70, -62, -1)}
          {arm(86, 70, 62, -1)}
        </>
      )
    case 'gift':
      return (
        <>
          <rect x="34" y="77" width="32" height="21" rx="3" fill="#ff4d6d" {...line} />
          <rect x="46.8" y="77" width="6.4" height="21" fill={MATTY.accent} />
          <rect x="31.5" y="71.5" width="37" height="8" rx="3" fill="#ff6b85" {...line} />
          <rect x="46.8" y="71.5" width="6.4" height="8" fill={MATTY.accent} />
          <path d="M50 71 C44 62 38 66 42 70Z M50 71 C56 62 62 66 58 70Z" fill={MATTY.accent} {...thin} />
          <circle cx="31.5" cy="88" r="5.8" fill={MATTY.accent} {...line} />
          <circle cx="68.5" cy="88" r="5.8" fill={MATTY.accent} {...line} />
        </>
      )
    default:
      return (
        <>
          {leftDown}
          {rightDown}
        </>
      )
  }
}

/** What Matty puts on over the helmet for a season. */
export type MattyHat = 'santa' | 'witch'
const SEASON_HAT: Record<string, MattyHat> = { xmas: 'santa', halloween: 'witch' }

function SeasonHat({ hat }: { hat: MattyHat }) {
  if (hat === 'santa')
    return (
      <g {...line}>
        <path d="M27 18 C32 -4 58 -12 72 -2 C82 5 87 14 86 24 C80 18 76 14 71 13 L73 19Z" fill="#e8375a" />
        <path d="M21 26 C30 2 70 2 79 26 C80 30 75 32 72 28 C64 10 36 10 28 28 C25 32 20 30 21 26Z" fill="#ffffff" />
        <circle cx="87" cy="27" r="6" fill="#ffffff" />
      </g>
    )
  return (
    <g {...line}>
      <path d="M31 13 L49 -15 Q59 -24 70 -17 Q62 -15 61 -8 L69 13Z" fill="#3a2a5c" />
      <path d="M13 23 C30 1 70 1 87 23 C81 27 66 14 50 14 C34 14 19 27 13 23Z" fill="#4a3675" />
      <path d="M34 8 C44 4 56 4 66 8 L68.5 13.5 C56 8.5 44 8.5 31.5 13.5Z" fill="#ff8a3c" />
      <rect x="46" y="3" width="8" height="7.5" rx="1.5" fill="#ffd23f" />
    </g>
  )
}

/** The drawing itself, for placing Matty inside another picture (viewBox -6 -8 112 118). */
export function MattyArt({ pose = 'happy', hat }: { pose?: MattyPose; hat?: MattyHat }) {
  return (
    <>
      <Suit />
      <Helmet />
      <Face pose={pose} />
      {hat ? <SeasonHat hat={hat} /> : null}
      <Arms pose={pose} />
    </>
  )
}

/** Matty, whole. `size` is the width in CSS pixels. In season he wears a hat over the helmet. */
export function Matty({ pose = 'happy', size = 96, bounce, className = '' }: { pose?: MattyPose; size?: number; bounce?: boolean; className?: string }) {
  const season = useSeason()
  return (
    <svg
      className={`matty${bounce ? ' bounce' : ''} ${className}`}
      viewBox="-6 -8 112 118"
      width={size}
      height={(size * 118) / 112}
      role="img"
      aria-label="Matty"
      // A hat may reach above the canvas.
      style={{ flex: 'none', overflow: 'visible' } as CSSProperties}
    >
      <MattyArt pose={pose} hat={season ? SEASON_HAT[season.id] : undefined} />
    </svg>
  )
}

/** Just the helmet: for buttons, feedback and anywhere small. */
export function MattyFace({ pose = 'happy', size = 32 }: { pose?: MattyPose; size?: number }) {
  return (
    <svg className="matty-face" viewBox="10 -8 80 82" width={size} height={(size * 82) / 80} aria-hidden="true" style={{ flex: 'none' }}>
      <Helmet />
      <Face pose={pose} />
    </svg>
  )
}

/** Matty with a speech bubble. Tapping anywhere on it calls `onTap` (to open a gift, hear the text…). */
export function MattySays({
  pose = 'happy',
  size = 84,
  children,
  onTap,
  side = 'left',
  className = '',
}: {
  pose?: MattyPose
  size?: number
  children: ReactNode
  onTap?: () => void
  /** Which side Matty stands on. */
  side?: 'left' | 'right'
  className?: string
}) {
  const body = (
    <>
      <Matty pose={pose} size={size} />
      <span className="matty-bubble">{children}</span>
    </>
  )
  const cls = `matty-says ${side} ${className}`
  return onTap ? (
    <button type="button" className={cls} onClick={onTap}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  )
}
