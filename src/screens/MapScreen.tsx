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
  familyWorld,
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
  weekDays,
  weeklyGoal,
  worldDone,
  worldStars,
  zoneStars,
  ZONE_MAX_STARS,
  type Profile,
} from '../core/store'
import { ZONES } from '../core/types'
import { useT } from '../i18n'
import { ProfileAvatar } from '../ui/Character'
import { Chip, Modal, speak } from '../ui/kit'
import { Matty, type MattyPose } from '../ui/Matty'
import { Icon, KindIcon } from '../ui/icons'
import { SceneBadge, Sprite } from '../ui/scene'
import { SeasonSky } from '../ui/Season'
import { TrailGround, TrailNode, TrailRoad, trailHeight } from './Trail'

/** The journey: one long trail from the beach up to space, with the player waiting at the next stop. */
/** Players who have already been told the opening story since the app was opened. */
const storyTold = new Set<string>()

export function MapScreen() {
  const { t, lang } = useT()
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
  const mission2 = activeHomework(p, Date.now(), 'family')
  const homeWorld = familyWorld(p)
  const goal = weeklyGoal(p)
  // A brand-new player is told why the journey matters before anything else, once per visit.
  const [story, setStory] = useState(() => Object.keys(p.levels).length === 0 && !storyTold.has(p.id))
  useEffect(() => {
    if (!story) return
    storyTold.add(p.id)
    if (p.band === 'A') speak(`${t('story.title', { name: p.name })}. ${t('story.text')}`, lang)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story])
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
          <Chip icon={<Icon name="star" size={20} />} label={t('hub.stars')}>
            {totalStars(p)}
          </Chip>
          <Chip icon={<Icon name="coin" size={20} />} label={t('hub.coins')}>
            {p.coins}
          </Chip>
          <span className="chip plan-chip" role="img" aria-label={t('plan.week', { n: weekDays(p), plan: goal.days })} title={t('plan.week', { n: weekDays(p), plan: goal.days })}>
            <Icon name="calendar" size={20} />
            {Array.from({ length: goal.days }, (_, i) => (
              <i key={i} className={i < weekDays(p) ? 'on' : ''} />
            ))}
          </span>
          <button className={`chip music-toggle${music ? '' : ' off'}`} onClick={() => setMusic(!music)} aria-pressed={music} aria-label={t('music')}>
            <Icon name={music ? 'music' : 'musicOff'} size={20} />
          </button>
        </div>
      </header>

      {mission ? (
        <button className="hw-banner mission" onClick={open(() => go({ id: 'screen' }))}>
          <Icon name="rocket" size={26} />
          <strong>{t('screen.title')}</strong>
          <span className="hw-count">{t('screen.banner')}</span>
        </button>
      ) : null}
      {hw ? (
        <button className="hw-banner" onClick={open(() => go({ id: 'class' }))}>
          <Icon name="book" size={26} />
          <strong>{t(`topic.${hw.topic}` as 'topic.n20')}</strong>
          <span className="hw-count">
            ⭐ {Math.min(homeworkStars(p, hw), hw.goal)}/{hw.goal}
          </span>
        </button>
      ) : null}

      {mission2 ? (
        <button className="hw-banner family" onClick={open(() => go({ id: 'family' }))}>
          <Icon name="heart" size={26} />
          <strong>{t(`topic.${mission2.topic}` as 'topic.n20')}</strong>
          <span className="hw-count">
            ⭐ {Math.min(homeworkStars(p, mission2, 'family'), mission2.goal)}/{mission2.goal}
          </span>
        </button>
      ) : null}
      {homeWorld ? (
        <button className="hw-banner family" onClick={open(() => go({ id: 'world', src: 'family' }))}>
          <SceneBadge scene={homeWorld.scene} size={28} />
          <strong>{homeWorld.name}</strong>
          <span className="hw-count">
            ⭐ {worldStars(p, homeWorld)}/{homeWorld.stops.length * 3}
          </span>
        </button>
      ) : null}
      {lesson ? (
        <button className="hw-banner world" onClick={open(() => go({ id: 'world', src: 'class' }))}>
          <SceneBadge scene={lesson.scene} size={28} />
          <strong>{lesson.name}</strong>
          <span className="hw-count">
            ⭐ {worldStars(p, lesson)}/{lesson.stops.length * 3}
          </span>
        </button>
      ) : null}
      {festive && season ? (
        <button className={`hw-banner world season-${season.id}`} onClick={open(() => go({ id: 'world', src: 'season' }))}>
          <SceneBadge scene={festive.scene} size={28} />
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
                  <SceneBadge scene={zone} size={30} />
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
                    icon={<KindIcon kind={stop.kind} />}
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

      {story ? (
        <Modal onClose={() => setStory(false)}>
          <div className="story">
            <div className="story-rocket">
              <Matty pose="hi" size={104} bounce />
              <Sprite name="rocket" size={84} />
            </div>
            <h2>{t('story.title', { name: p.name })}</h2>
            <p>{t('story.text')}</p>
            <span className="fuel" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <i key={i}>⭐</i>
              ))}
            </span>
            <button
              className="btn btn-primary btn-big"
              onClick={() => {
                sfx('star')
                setStory(false)
                go({ id: 'play', stop: 0 })
              }}
            >
              🚀 {t('story.go')}
            </button>
          </div>
        </Modal>
      ) : null}

      <nav className="dock">
        <button className={`dock-btn dojo${dojoDue ? ' due' : ''}`} onClick={open(() => go({ id: 'dojo' }))}>
          <Icon name="bolt" size={28} />
          {t('nav.dojo')}
        </button>
        <button className="dock-btn" onClick={open(() => go({ id: 'class' }))}>
          <Icon name="school" size={28} />
          {t('nav.class')}
        </button>
        <button className="dock-btn" onClick={open(() => go({ id: 'shop' }))}>
          <Icon name="shirt" size={28} />
          {t('nav.shop')}
        </button>
        <button className="dock-btn" onClick={open(() => go({ id: 'grownups' }))}>
          <Icon name="adult" size={28} />
          {t('nav.grownups')}
        </button>
        <button
          className="dock-btn"
          onClick={open(() => {
            selectProfile(null)
            go({ id: 'welcome' }, { reset: true })
          })}
        >
          <Icon name="players" size={28} />
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

