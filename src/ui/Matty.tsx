import type { CSSProperties, ReactNode } from 'react'

/**
 * Matty, the mascot: a small teal explorer in a sun-yellow scarf, whose two ears draw an "M".
 *
 * Everything is a handful of vector shapes on a 100×110 canvas, so the same drawing serves the
 * app, print and animation. The palette and proportions are documented in brand/README.md —
 * change them there and here together.
 */
export const MATTY = {
  ink: '#23164f',
  body: 'var(--m-body, #35c9b8)',
  belly: 'var(--m-belly, #e6fff7)',
  foot: 'var(--m-foot, #1fa596)',
  ear: 'var(--m-ear, #ffd23f)',
  cheek: 'var(--m-cheek, #ff9fb5)',
  scarf: 'var(--m-scarf, #ffd23f)',
  scarfDark: 'var(--m-scarf-dark, #f2a900)',
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

function Ears() {
  return (
    <g fill={MATTY.body} {...line}>
      <path d="M26 42 C17 26 20 10 29 6 C38 10 45 22 47 34Z" />
      <path d="M74 42 C83 26 80 10 71 6 C62 10 55 22 53 34Z" />
      <path d="M28.5 35 C24 26 25.5 17 29.5 12.5 C35 17 38.5 24 40.5 31Z" fill={MATTY.ear} stroke="none" />
      <path d="M71.5 35 C76 26 74.5 17 70.5 12.5 C65 17 61.5 24 59.5 31Z" fill={MATTY.ear} stroke="none" />
    </g>
  )
}

function Body() {
  return (
    <>
      <path d="M50 27 C73 27 88 44 88 66 C88 90 72 103 50 103 C28 103 12 90 12 66 C12 44 27 27 50 27Z" fill={MATTY.body} {...line} />
      <ellipse cx="50" cy="85" rx="22" ry="14.5" fill={MATTY.belly} />
      <path d="M45 28 Q46 19 50 23.5 Q52.5 17 55 28Z" fill={MATTY.body} {...line} />
    </>
  )
}

function Face({ pose }: { pose: MattyPose }) {
  const closed = pose === 'cheer'
  const big = pose === 'wow'
  return (
    <>
      <circle cx="26.5" cy="62" r="5.6" fill={MATTY.cheek} opacity=".9" />
      <circle cx="73.5" cy="62" r="5.6" fill={MATTY.cheek} opacity=".9" />
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
    </>
  )
}

function Scarf() {
  return (
    <>
      <path d="M68 83 L80 100 L71 96.5 L66 101 L62 86Z" fill={MATTY.scarfDark} {...line} />
      <path d="M15.5 70 Q50 86 84.5 70 L86 79 Q50 96 14 79Z" fill={MATTY.scarf} {...line} />
    </>
  )
}

const arm = (cx: number, cy: number, rot: number, rx = 5.6, ry = 9) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={MATTY.body} {...line} transform={`rotate(${rot} ${cx} ${cy})`} />
)

function Arms({ pose }: { pose: MattyPose }) {
  switch (pose) {
    case 'hi':
      return (
        <>
          {arm(13, 75, 18)}
          {arm(91, 53, -30)}
          <path d="M97 40 Q100 43 99 47 M101 46 Q103.5 49 102 53" fill="none" {...thin} strokeWidth={1.6} />
        </>
      )
    case 'cheer':
      return (
        <>
          {arm(10.5, 50, 30)}
          {arm(89.5, 50, -30)}
          <Sparkle x={10} y={26} size={6} fill="#ffd23f" />
          <Sparkle x={92} y={22} size={7.5} fill="#ff4d6d" />
        </>
      )
    case 'think':
      return (
        <>
          {arm(13, 75, 18)}
          {arm(63, 73, 58, 5.2, 8.6)}
          <Sparkle x={88} y={24} size={8} fill="#ffd23f" />
        </>
      )
    case 'point':
      return (
        <>
          {arm(13, 75, 18)}
          {arm(93, 66, -80)}
        </>
      )
    case 'wow':
      return (
        <>
          {arm(9, 62, 62)}
          {arm(91, 62, -62)}
        </>
      )
    case 'gift':
      return (
        <>
          <rect x="33.5" y="77" width="33" height="22" rx="3" fill="#ff4d6d" {...line} />
          <rect x="46.8" y="77" width="6.4" height="22" fill="#ffd23f" />
          <rect x="31" y="71.5" width="38" height="8" rx="3" fill="#ff6b85" {...line} />
          <rect x="46.8" y="71.5" width="6.4" height="8" fill="#ffd23f" />
          <path d="M50 71 C44 62 38 66 42 70Z M50 71 C56 62 62 66 58 70Z" fill="#ffd23f" {...thin} />
          {arm(30.5, 87, -8, 5.2, 6.6)}
          {arm(69.5, 87, 8, 5.2, 6.6)}
        </>
      )
    default:
      return (
        <>
          {arm(13, 75, 18)}
          {arm(87, 75, -18)}
        </>
      )
  }
}

/** Matty, whole. `size` is the width in CSS pixels. */
export function Matty({ pose = 'happy', size = 96, bounce, className = '' }: { pose?: MattyPose; size?: number; bounce?: boolean; className?: string }) {
  return (
    <svg
      className={`matty${bounce ? ' bounce' : ''} ${className}`}
      viewBox="-6 0 112 110"
      width={size}
      height={(size * 110) / 112}
      role="img"
      aria-label="Matty"
      style={{ flex: 'none' } as CSSProperties}
    >
      <ellipse cx="37" cy="103.5" rx="9.5" ry="5.2" fill={MATTY.foot} {...line} />
      <ellipse cx="63" cy="103.5" rx="9.5" ry="5.2" fill={MATTY.foot} {...line} />
      <Ears />
      <Body />
      <Face pose={pose} />
      <Scarf />
      <Arms pose={pose} />
    </svg>
  )
}

/** Just the head: for buttons, feedback and anywhere small. */
export function MattyFace({ pose = 'happy', size = 32 }: { pose?: MattyPose; size?: number }) {
  return (
    <svg className="matty-face" viewBox="8 2 84 74" width={size} height={(size * 74) / 84} aria-hidden="true" style={{ flex: 'none' }}>
      <Ears />
      <Body />
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
