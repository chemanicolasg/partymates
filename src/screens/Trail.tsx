import type { ReactNode, Ref } from 'react'
import type { SeasonId } from '../core/seasons'
import type { Profile } from '../core/store'
import type { SceneId } from '../core/worlds'
import { ProfileAvatar } from '../ui/Character'
import { Icon } from '../ui/icons'
import { Stars } from '../ui/kit'
import { Sprite, Terrain, TRAIL_PROPS } from '../ui/scene'

/** Horizontal position (%) of each stop along a winding trail. */
export const XS = [50, 73, 60, 32, 24, 45, 71, 62, 35, 50]
const STEP = 104
const FOOT = 96
export const trailHeight = (stops: number) => FOOT + STEP * stops
export const stopY = (i: number, stops: number) => trailHeight(stops) - FOOT - STEP * (i + 0.5)

/** What a season scatters over every place while it lasts: [name, left %, top %, size px]. */
const SEASON_PROPS: Record<SeasonId, [string, number, number, number][]> = {
  halloween: [['bat', 84, 12, 46], ['pumpkin', 4, 27, 58], ['ghost', 84, 50, 56], ['candy', 6, 72, 42], ['pumpkin', 84, 95, 50]],
  xmas: [['snowflake', 86, 12, 34], ['gift', 4, 28, 52], ['snowman', 82, 49, 64], ['cane', 6, 71, 48], ['xtree', 82, 93, 60]],
}

/** The ground of a trail: strips of terrain and the props standing on them. */
export function TrailGround({ scene, stops, season }: { scene: SceneId; stops: number; season?: SeasonId | null }) {
  // A short trail has no room for every prop of a full zone.
  const props = TRAIL_PROPS[scene].filter((_, i) => stops >= 8 || i % 2 === 0)
  const extra = season && season !== scene ? SEASON_PROPS[season] : []
  return (
    <>
      <Terrain scene={scene} height={trailHeight(stops)} />
      {season ? <i className="season-tint" /> : null}
      {[...props, ...extra].map(([name, left, top, size], i) => (
        <span key={i} className="zone-decor" style={{ left: `${left}%`, top: `${top}%` }}>
          <Sprite name={name} size={size} />
        </span>
      ))}
      <i className="grain" />
    </>
  )
}

/** The road through the stops. It goes in the same column as them, so both line up at any width. */
export function TrailRoad({ stops }: { stops: number }) {
  const height = trailHeight(stops)
  const points = [[50, height], ...Array.from({ length: stops }, (_, i) => [XS[i % XS.length], stopY(i, stops)]), [50, 0]]
  // A smooth line through the stops: each one is the control point between two midpoints.
  const mid = (a: number[], b: number[]) => `${(a[0] + b[0]) / 2},${(a[1] + b[1]) / 2}`
  const road =
    `M${points[0]} L${mid(points[0], points[1])} ` +
    points
      .slice(1, -1)
      .map((p, i) => `Q${p} ${mid(p, points[i + 2])}`)
      .join(' ') +
    ` L${points[points.length - 1]}`
  return (
    <svg className="road" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={road} className="road-shadow" transform="translate(0 6)" />
      <path d={road} className="road-edge" />
      <path d={road} className="road-top" />
      <path d={road} className="road-line" />
    </svg>
  )
}

/** One stop on a trail. */
export function TrailNode({
  i,
  stops,
  open,
  here,
  boss,
  stars,
  icon,
  label,
  hero,
  onClick,
  nodeRef,
}: {
  i: number
  stops: number
  open: boolean
  here: boolean
  boss?: boolean
  stars: number
  icon: ReactNode
  label: string
  hero: Profile
  onClick: () => void
  nodeRef?: Ref<HTMLButtonElement>
}) {
  return (
    <button
      ref={nodeRef}
      className={`node${open ? '' : ' locked'}${boss ? ' boss' : ''}${here ? ' current' : ''}${stars ? ' done' : ''}`}
      style={{ left: `${XS[i % XS.length]}%`, top: stopY(i, stops) }}
      disabled={!open}
      aria-label={`${label}${open ? '' : ' 🔒'}`}
      onClick={onClick}
    >
      {here ? (
        <span className="node-hero">
          <ProfileAvatar p={hero} size={46} bounce />
        </span>
      ) : null}
      <span className="node-disc">{open ? icon : <Icon name="lock" size={26} />}</span>
      {boss && open ? (
        <span className="node-crown">
          <Icon name="crown" size={30} />
        </span>
      ) : null}
      <Stars n={stars} />
    </button>
  )
}
