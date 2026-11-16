import type { CSSProperties } from 'react'
import type { SeasonId } from '../core/seasons'
import { Sprite } from './scene'

/** What drifts across the sky in each season. */
const DRIFT: Record<SeasonId, { sprite: string; count: number; min: number; max: number }> = {
  halloween: { sprite: 'bat', count: 6, min: 26, max: 40 },
  xmas: { sprite: 'snowflake', count: 18, min: 10, max: 22 },
}

/**
 * Snow falling or bats crossing, over a map. Purely decorative: it never catches a tap, and with
 * "reduce motion" switched on the pieces simply stay where they are.
 */
export function SeasonSky({ season }: { season: SeasonId }) {
  const { sprite, count, min, max } = DRIFT[season]
  return (
    <div className={`season-sky season-${season}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        // Spread by index, so the pattern is the same on every visit and needs no random state.
        const along = (i * 37 + 11) % 100
        const style = {
          '--along': `${along}%`,
          '--across': `${(i * 53 + 7) % 90}%`,
          animationDuration: `${9 + (i % 5) * 2.5}s`,
          animationDelay: `${-((i * 1.9) % 14)}s`,
        } as CSSProperties
        return (
          <i key={i} style={style}>
            <Sprite name={sprite} size={min + ((i * 7) % (max - min + 1))} />
          </i>
        )
      })}
    </div>
  )
}
