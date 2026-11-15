import { useEffect, useRef } from 'react'
import { sfx } from '../core/audio'
import { back, go } from '../core/nav'
import { isUnlocked, levelStars, useProfile, worldStars } from '../core/store'
import { LEVELS_PER_WORLD, type WorldId } from '../core/types'
import { useT } from '../i18n'
import { Chip, ProfileAvatar, Stars, TopBar } from '../ui/kit'
import { WORLD_ART } from './worlds'

/** Horizontal position (%) of each stop along the winding trail. */
const XS = [50, 74, 58, 30, 24, 46, 72, 50]
const STEP = 118
const TOP = 80

export function WorldScreen({ world }: { world: WorldId }) {
  const { t } = useT()
  const p = useProfile()
  const current = useRef<HTMLButtonElement>(null)
  const levels = Array.from({ length: LEVELS_PER_WORLD }, (_, i) => i)
  // The furthest open level is where the avatar waits.
  const frontier = levels.filter((i) => isUnlocked(p, world, i)).pop() ?? 0
  const height = TOP + STEP * LEVELS_PER_WORLD
  const y = (i: number) => height - STEP * (i + 0.5)

  useEffect(() => {
    current.current?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <div className={`screen world world-${world}`}>
      <TopBar title={`${WORLD_ART[world].icon} ${t(`world.${world}`)}`} onBack={back}>
        <Chip icon="⭐">
          {worldStars(p, world)}/{LEVELS_PER_WORLD * 3}
        </Chip>
      </TopBar>
      <div className="trail-scroll">
        <div className="trail" style={{ height }}>
          <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
            <polyline points={levels.map((i) => `${XS[i]},${y(i)}`).join(' ')} />
          </svg>
          {WORLD_ART[world].scene.map((e, k) => (
            <span key={k} className="trail-deco" style={{ left: `${[8, 84, 12, 80][k]}%`, top: `${[12, 30, 58, 82][k]}%` }}>
              {e}
            </span>
          ))}
          {levels.map((i) => {
            const open = isUnlocked(p, world, i)
            const stars = levelStars(p, world, i)
            const boss = i === LEVELS_PER_WORLD - 1
            return (
              <button
                key={i}
                ref={i === frontier ? current : undefined}
                className={`node${open ? '' : ' locked'}${boss ? ' boss' : ''}${i === frontier ? ' current' : ''}${stars ? ' done' : ''}`}
                style={{ left: `${XS[i]}%`, top: y(i) }}
                disabled={!open}
                aria-label={`${t('level.n', { n: i + 1 })}${open ? '' : ` 🔒`}`}
                onClick={() => {
                  sfx('tap')
                  go({ id: 'play', world, index: i })
                }}
              >
                {i === frontier ? (
                  <span className="node-hero">
                    <ProfileAvatar p={p} size={40} bounce />
                  </span>
                ) : null}
                <span className="node-disc">{open ? (boss ? '👑' : i + 1) : '🔒'}</span>
                <Stars n={stars} />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
