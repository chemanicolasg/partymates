import { useEffect, useRef, useState } from 'react'
import { sfx } from '../core/audio'
import { JOURNEY, STOPS_PER_ZONE } from '../core/curriculum'
import type { Homework, Screening } from '../core/backend'
import { go } from '../core/nav'
import { dayKey, levelProgress, playerLevel } from '../core/scoring'
import {
  activeHomework,
  claimGift,
  classWorld,
  frontier,
  giftReady,
  pendingScreening,
  homeworkStars,
  isStopOpen,
  refreshClass,
  seasonWorldOf,
  selectProfile,
  setMusic,
  stopStars,
  totalStars,
  useApp,
  useProfile,
  useSeason,
  worldDone,
  worldStars,
  zoneStars,
  ZONE_MAX_STARS,
  type Profile,
} from '../core/store'
import { ZONES } from '../core/types'
import { useT } from '../i18n'
import { ProfileAvatar } from '../ui/Character'
import { Chip, speak } from '../ui/kit'
import { Matty, type MattyPose } from '../ui/Matty'
import { SCENE_ICON } from '../ui/scene'
import { SeasonSky } from '../ui/Season'
import { KIND_ICON, ZONE_ICON } from './art'
import { TrailGround, TrailNode, TrailRoad, trailHeight } from './Trail'

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
  const season = useSeason()
  const festive = seasonWorldOf(p, season)
  const lesson = classWorld(p)
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

      {lesson ? (
        <button className="hw-banner world" onClick={open(() => go({ id: 'world', src: 'class' }))}>
          <span>{SCENE_ICON[lesson.scene]}</span>
          <strong>{lesson.name}</strong>
          <span className="hw-count">
            ⭐ {worldStars(p, lesson)}/{lesson.stops.length * 3}
          </span>
        </button>
      ) : null}
      {festive && season ? (
        <button className={`hw-banner world season-${season.id}`} onClick={open(() => go({ id: 'world', src: 'season' }))}>
          <span>{SCENE_ICON[festive.scene]}</span>
          <strong>{t(`season.${season.id}.world`)}</strong>
          <span className="hw-count">{worldDone(p, festive) ? '🎁 ✔' : `⭐ ${worldStars(p, festive)}/${festive.stops.length * 3}`}</span>
        </button>
      ) : null}

      <div className="map-wrap">
      {season ? <SeasonSky season={season.id} /> : null}
      <main className="map">
        {[...ZONES].reverse().map((zone) => {
          const z = ZONES.indexOf(zone)
          const stops = JOURNEY.filter((s) => s.zone === zone)
          const reached = isStopOpen(p, z * STOPS_PER_ZONE)
          return (
            <section key={zone} className={`zone scene-${zone}${reached ? '' : ' far'}`} style={{ height: trailHeight(STOPS_PER_ZONE) }}>
              <TrailGround scene={zone} stops={STOPS_PER_ZONE} season={season?.id} />
              <div className="zone-inner">
                <TrailRoad stops={STOPS_PER_ZONE} />
                <div className="zone-sign">
                  <span>{ZONE_ICON[zone]}</span>
                  <strong>{t(`zone.${zone}`)}</strong>
                  <small>
                    ⭐ {zoneStars(p, zone)}/{ZONE_MAX_STARS}
                  </small>
                </div>
                {stops.map((stop, i) => (
                  <TrailNode
                    key={stop.index}
                    nodeRef={stop.index === here ? current : undefined}
                    i={i}
                    stops={STOPS_PER_ZONE}
                    open={isStopOpen(p, stop.index)}
                    here={stop.index === here}
                    boss={stop.boss}
                    stars={stopStars(p, stop)}
                    icon={KIND_ICON[stop.kind]}
                    label={`${t(`mission.${stop.kind}`)} ${stop.index + 1}`}
                    hero={p}
                    onClick={open(() => go({ id: 'play', stop: stop.index }))}
                  />
                ))}
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

