import { useEffect, useRef, useState } from 'react'
import { sfx } from '../core/audio'
import { JOURNEY, STOPS_PER_ZONE } from '../core/curriculum'
import type { Homework, Screening } from '../core/backend'
import { go } from '../core/nav'
import { dayKey, levelProgress, playerLevel } from '../core/scoring'
import {
  activeHomework,
  claimGift,
  frontier,
  giftReady,
  pendingScreening,
  homeworkStars,
  isStopOpen,
  refreshClass,
  selectProfile,
  setMusic,
  stopStars,
  totalStars,
  useApp,
  useProfile,
  zoneStars,
  ZONE_MAX_STARS,
  type Profile,
} from '../core/store'
import { ZONES } from '../core/types'
import { useT } from '../i18n'
import { ProfileAvatar } from '../ui/Character'
import { Chip, speak, Stars } from '../ui/kit'
import { Matty, type MattyPose } from '../ui/Matty'
import { Decor, KIND_ICON, ZONE_DECOR, ZONE_ICON } from './art'

/** Horizontal position (%) of each stop along a zone's winding trail. */
const XS = [50, 73, 60, 32, 24, 45, 71, 62, 35, 50]
const STEP = 104
const FOOT = 96
const HEIGHT = FOOT + STEP * STOPS_PER_ZONE
const y = (i: number) => HEIGHT - FOOT - STEP * (i + 0.5)

/** The journey: one long trail from the beach up to space, with the player waiting at the next stop. */
export function MapScreen() {
  const { t } = useT()
  const p = useProfile()
  const music = useApp((s) => s.music)
  const current = useRef<HTMLButtonElement>(null)
  const here = frontier(p)
  const dojoDue = p.dojo.lastDay !== dayKey()
  const hw = activeHomework(p)
  const mission = pendingScreening(p)
  const open = (fn: () => void) => () => {
    sfx('tap')
    fn()
  }

  useEffect(() => {
    current.current?.scrollIntoView({ block: 'center' })
    // Homework may have changed since the last visit.
    void refreshClass().catch(() => {})
  }, [])

  return (
    <div className="screen hub">
      <header className="hub-top">
        <button className="hub-me" onClick={open(() => go({ id: 'shop' }))} aria-label={t('nav.shop')}>
          <ProfileAvatar p={p} size={54} />
          <span className="hub-me-text">
            <strong>{p.name}</strong>
            <small>{t('hub.level', { n: playerLevel(p.xp) })}</small>
            <span className="xp-bar">
              <i style={{ width: `${levelProgress(p.xp) * 100}%` }} />
            </span>
          </span>
        </button>
        <div className="hub-chips">
          <Chip icon="⭐" label={t('hub.stars')}>
            {totalStars(p)}
          </Chip>
          <Chip icon="🪙" label={t('hub.coins')}>
            {p.coins}
          </Chip>
          <button className={`chip music-toggle${music ? '' : ' off'}`} onClick={() => setMusic(!music)} aria-pressed={music} aria-label={t('music')}>
            {music ? '🎵' : '🔇'}
          </button>
        </div>
      </header>

      {mission ? (
        <button className="hw-banner mission" onClick={open(() => go({ id: 'screen' }))}>
          <span>🚀</span>
          <strong>{t('screen.title')}</strong>
          <span className="hw-count">{t('screen.banner')}</span>
        </button>
      ) : null}
      {hw ? (
        <button className="hw-banner" onClick={open(() => go({ id: 'class' }))}>
          <span>📚</span>
          <strong>{t(`topic.${hw.topic}` as 'topic.n20')}</strong>
          <span className="hw-count">
            ⭐ {Math.min(homeworkStars(p, hw), hw.goal)}/{hw.goal}
          </span>
        </button>
      ) : null}

      <div className="map-wrap">
      <main className="map">
        {[...ZONES].reverse().map((zone) => {
          const z = ZONES.indexOf(zone)
          const stops = JOURNEY.filter((s) => s.zone === zone)
          const reached = isStopOpen(p, z * STOPS_PER_ZONE)
          return (
            <section key={zone} className={`zone zone-${zone}${reached ? '' : ' far'}`} style={{ height: HEIGHT }}>
              {ZONE_DECOR[zone].map(([name, left, top, size], i) => (
                <span key={i} className="zone-decor" style={{ left: `${left}%`, top: `${top}%` }}>
                  <Decor name={name} size={size} />
                </span>
              ))}
              <div className="zone-inner">
              <svg className="zone-path" viewBox={`0 0 100 ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
                <polyline points={[`50,${HEIGHT}`, ...stops.map((_, i) => `${XS[i]},${y(i)}`), '50,0'].join(' ')} />
              </svg>
              <div className="zone-sign">
                <span>{ZONE_ICON[zone]}</span>
                <strong>{t(`zone.${zone}`)}</strong>
                <small>
                  ⭐ {zoneStars(p, zone)}/{ZONE_MAX_STARS}
                </small>
              </div>
              {stops.map((stop, i) => {
                const isOpen = isStopOpen(p, stop.index)
                const stars = stopStars(p, stop)
                const isHere = stop.index === here
                return (
                  <button
                    key={stop.index}
                    ref={isHere ? current : undefined}
                    className={`node${isOpen ? '' : ' locked'}${stop.boss ? ' boss' : ''}${isHere ? ' current' : ''}${stars ? ' done' : ''}`}
                    style={{ left: `${XS[i]}%`, top: y(i) }}
                    disabled={!isOpen}
                    aria-label={`${t(`mission.${stop.kind}`)} ${stop.index + 1}${isOpen ? '' : ' 🔒'}`}
                    onClick={open(() => go({ id: 'play', stop: stop.index }))}
                  >
                    {isHere ? (
                      <span className="node-hero">
                        <ProfileAvatar p={p} size={46} bounce />
                      </span>
                    ) : null}
                    <span className="node-disc">{isOpen ? KIND_ICON[stop.kind] : '🔒'}</span>
                    {stop.boss && isOpen ? <span className="node-crown">👑</span> : null}
                    <Stars n={stars} />
                  </button>
                )
              })}
              </div>
            </section>
          )
        })}
      </main>
      <MapBuddy p={p} hw={hw && homeworkStars(p, hw) < hw.goal ? hw : null} mission={mission} dojoDue={dojoDue} />
      </div>

      <nav className="dock">
        <button className={`dock-btn dojo${dojoDue ? ' due' : ''}`} onClick={open(() => go({ id: 'dojo' }))}>
          <span>⚡</span>
          {t('nav.dojo')}
        </button>
        <button className="dock-btn" onClick={open(() => go({ id: 'class' }))}>
          <span>🏫</span>
          {t('nav.class')}
        </button>
        <button className="dock-btn" onClick={open(() => go({ id: 'shop' }))}>
          <span>👕</span>
          {t('nav.shop')}
        </button>
        <button className="dock-btn" onClick={open(() => go({ id: 'grownups' }))}>
          <span>🧑‍🏫</span>
          {t('nav.grownups')}
        </button>
        <button
          className="dock-btn"
          onClick={open(() => {
            selectProfile(null)
            go({ id: 'welcome' }, { reset: true })
          })}
        >
          <span>👥</span>
          {t('nav.switch')}
        </button>
      </nav>
    </div>
  )
}

/**
 * Matty on the map: once a day there is a present to open; otherwise a nudge towards whatever
 * is worth doing next. The bubble folds away after a few seconds so it never hides the trail.
 */
function MapBuddy({ p, hw, mission, dojoDue }: { p: Profile; hw: Homework | null; mission: Screening | null; dojoDue: boolean }) {
  const { t, lang } = useT()
  const [opened, setOpened] = useState<number | null>(null)
  const [talking, setTalking] = useState(true)
  const present = giftReady(p)
  const firstVisit = Object.keys(p.levels).length === 0

  let pose: MattyPose = 'happy'
  let text = t('matty.go')
  if (opened !== null) [pose, text] = ['cheer', t('matty.giftOpen', { n: opened })]
  else if (present) [pose, text] = ['gift', t('matty.gift')]
  else if (firstVisit) [pose, text] = ['hi', t('matty.start')]
  else if (mission) [pose, text] = ['point', t('matty.mission')]
  else if (hw) [pose, text] = ['point', t('matty.homework', { topic: t(`topic.${hw.topic}` as 'topic.n20') })]
  else if (dojoDue) [pose, text] = ['think', t('matty.dojo')]

  // A present keeps Matty talking; anything else is said once and then he steps back.
  useEffect(() => {
    if (present && opened === null) return
    const id = window.setTimeout(() => setTalking(false), 7000)
    return () => clearTimeout(id)
  }, [present, opened, talking])

  const tap = () => {
    if (present) {
      const coins = claimGift()
      if (coins) {
        sfx('coin')
        setOpened(coins)
        setTalking(true)
        return
      }
    }
    sfx('tap')
    setTalking(!talking)
    if (!talking) speak(text, lang)
  }

  return (
    <button className={`map-buddy${talking ? ' talking' : ''}`} onClick={tap} aria-label={`Matty: ${text}`}>
      {talking ? <span className="matty-bubble">{text}</span> : null}
      <Matty pose={pose} size={72} bounce={present && opened === null} />
    </button>
  )
}

