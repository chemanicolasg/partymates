import { useEffect, useRef, useState, type ReactNode } from 'react'
import { sfx } from '../core/audio'
import { eventSpecs, getLevel, JOURNEY } from '../core/curriculum'
import { playMusic, type TrackId } from '../core/music'
import { back, go } from '../core/nav'
import { playerLevel } from '../core/scoring'
import {
  activeHomework,
  classWorld,
  finishEvent,
  finishHomework,
  finishStop,
  finishWorldStop,
  homeworkStars,
  isNewKind,
  isStopOpen,
  isWorldStopOpen,
  rollEvent,
  seasonWorldOf,
  stopPlays,
  stopStars,
  useProfile,
  useSeason,
  wearItem,
  worldRecord,
  type Profile,
} from '../core/store'
import { ITEM_BY_ID, itemName } from '../core/look'
import { TOPIC_BY_ID } from '../core/topics'
import type { GameResult, PlayCfg, PlayKind } from '../core/types'
import type { SceneId } from '../core/worlds'
import { ArenaGame } from '../games/ArenaGame'
import { BayGame } from '../games/BayGame'
import { BridgeGame } from '../games/BridgeGame'
import { DodgeGame } from '../games/DodgeGame'
import { PairsGame } from '../games/PairsGame'
import { QuizGame } from '../games/QuizGame'
import { RaceGame } from '../games/RaceGame'
import { StonesGame } from '../games/StonesGame'
import { useT } from '../i18n'
import { Character } from '../ui/Character'
import { Confetti, CountUp, HelpContext, HowSteps, Modal, SayButton, speak, Stars } from '../ui/kit'
import { Matty, MattySays } from '../ui/Matty'
import { canShareFile, CARD_FILE, cardTexts, cardToPng, downloadBlob, tierFor, Trophy, TrophyCard, type CardCopy } from '../ui/Trophy'
import { Backdrop, SCENE_ICON } from '../ui/scene'
import { Icon, KindIcon } from '../ui/icons'
import { HOW_ICONS, ZONE_ICON } from './art'

/** How many stops at the start of the journey are shortened on the first visit, and to how many rounds. */
const WARM_UP_STOPS = 3
const WARM_UP_ROUNDS = 4

const MUSIC: Record<PlayKind, TrackId> = { blocks: 'blocks', party: 'party', arena: 'arena', bay: 'bay', stones: 'blocks', pairs: 'party', quiz: 'bay' }

interface Outcome {
  result: GameResult
  stars: number
  coins: number
  xp: number
  leveledUp: boolean
  /** Items unlocked by the stars of this level: Matty's presents. */
  gifts: string[]
}

function Game({ cfg, ...props }: { cfg: PlayCfg; profile: Profile; hints: boolean; firstTime: boolean; scene?: SceneId; onFinish: (r: GameResult) => void; onExit: () => void }) {
  switch (cfg.kind) {
    case 'blocks':
      return <BridgeGame cfg={cfg} {...props} />
    case 'party':
      return <RaceGame cfg={cfg} {...props} />
    case 'arena':
      return <ArenaGame cfg={cfg} {...props} />
    case 'bay':
      return <BayGame cfg={cfg} {...props} />
    case 'stones':
      return <StonesGame cfg={cfg} {...props} />
    case 'pairs':
      return <PairsGame cfg={cfg} {...props} />
    case 'quiz':
      return <QuizGame cfg={cfg} {...props} />
  }
}

/**
 * One activity from start to finish: the briefing card with pictogram steps, the game itself and
 * the result. What happens with the result (stars on the map, homework progress…) is up to the caller.
 */
function Activity({
  cfg,
  eyebrow,
  startWithHints,
  firstTime,
  save,
  resultExtra,
  cupPlace,
  scene,
  title,
  next,
}: {
  cfg: PlayCfg
  /** The place it happens in: its landscape shows behind the briefing and the result. */
  scene?: SceneId
  /** Name of the mission, when it is not simply the kind of activity. */
  title?: string
  eyebrow: string
  startWithHints: boolean
  firstTime: boolean
  save: (result: GameResult) => { stars: number; coins: number; xp: number; gifts?: string[] }
  resultExtra?: (outcome: Outcome) => ReactNode
  /** Where this was won, for the line under the title on the cup picture. Without it there is no cup. */
  cupPlace?: string
  /** Label and action of the "carry on" button, when there is somewhere to carry on to. */
  next?: (outcome: Outcome) => { label: string; go: () => void } | null
}) {
  const { t, lang } = useT()
  const profile = useProfile()
  const kind = cfg.kind
  const [phase, setPhase] = useState<'intro' | 'game' | 'result'>('intro')
  const [hints, setHints] = useState(startWithHints)
  const [attempt, setAttempt] = useState(0)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [cupOpen, setCupOpen] = useState(false)
  const steps = HOW_ICONS[kind].map((icon, i) => ({ icon, text: t(`how.${kind}.${(i + 1) as 1 | 2 | 3}`) }))
  const mission = title ?? t(`mission.${kind}`)
  const backdrop = scene ? <Backdrop scene={scene} /> : null
  const briefing = `${mission}. ${steps.map((s) => s.text).join('. ')}.`

  useEffect(() => {
    playMusic(MUSIC[kind])
    // The youngest players get the mission read out as soon as the card opens.
    if (profile.band === 'A') speak(briefing, lang)
    return () => window.speechSynthesis?.cancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onFinish = (result: GameResult) => {
    const before = playerLevel(profile.xp)
    const rewards = save(result)
    sfx(rewards.stars > 0 ? 'win' : 'bad')
    setOutcome({ result, ...rewards, gifts: rewards.gifts ?? [], leveledUp: playerLevel(profile.xp + rewards.xp) > before })
    setPhase('result')
  }
  const play = () => {
    sfx('tap')
    setAttempt(attempt + 1)
    setPhase('game')
  }

  if (phase === 'game')
    return (
      <div className={`screen world-${kind}${scene && kind === 'quiz' ? ' has-backdrop' : ''}`} key={attempt}>
        {/* The journey's games bring their own setting; the teacher's exercises borrow the world's. */}
        {kind === 'quiz' ? backdrop : null}
        <HelpContext.Provider value={{ tip: t(`tip.${kind}`), ask: () => setHints(true) }}>
          <Game cfg={cfg} profile={profile} hints={hints} firstTime={firstTime && attempt === 1} scene={scene} onFinish={onFinish} onExit={back} />
        </HelpContext.Provider>
      </div>
    )

  if (phase === 'result' && outcome) {
    const { stars, result } = outcome
    const onward = next?.(outcome) ?? null
    return (
      <div className={`screen world-${kind} center${scene ? ' has-backdrop' : ''}`}>
        {backdrop}
        {stars > 0 ? <Confetti /> : null}
        <div className="card result-card">
          <Matty pose={stars >= 2 ? 'cheer' : stars === 1 ? 'happy' : 'oops'} size={116} bounce={stars > 0} />
          <h1>{t(`res.s${stars}` as 'res.s0')}</h1>
          <Stars n={stars} big />
          <p className="result-score">{t('res.score', { ok: result.correct, total: result.total })}</p>
          <div className="result-loot">
            <span>
              <Icon name="coin" size={22} /> +<CountUp to={outcome.coins} lang={lang} />
            </span>
            <span>
              <Icon name="bolt" size={22} /> +<CountUp to={outcome.xp} lang={lang} />
            </span>
          </div>
          {outcome.leveledUp ? <p className="level-up">🎉 {t('res.levelUp', { n: playerLevel(profile.xp) })}</p> : null}
          {stars > 0 && cupPlace ? (
            <button
              className="cup-btn"
              onClick={() => {
                sfx('star')
                setCupOpen(true)
              }}
            >
              <Trophy tier={tierFor(stars)} size={62} />
              <span>
                <strong>{t(`cup.${tierFor(stars)}`)}</strong>
                <small>📥 {t('cup.get')}</small>
              </span>
            </button>
          ) : null}
          {outcome.gifts.length ? (
            <div className="matty-gift">
              <strong>🎁 {t('matty.presents')}</strong>
              <div className="pick-row">
                {outcome.gifts.map((id) => (
                  <Character key={id} look={{ ...profile.look, pet: null, [ITEM_BY_ID[id].type]: itemName(id) }} size={72} />
                ))}
              </div>
              <small>{t('matty.inWardrobe')}</small>
              {outcome.gifts.every((id) => profile.look[ITEM_BY_ID[id].type] === itemName(id)) ? (
                <strong className="done-today">✔ {t('shop.on')}</strong>
              ) : (
                <button
                  className="btn btn-small gift-wear"
                  onClick={() => {
                    sfx('coin')
                    outcome.gifts.forEach((id) => wearItem(id))
                  }}
                >
                  👕 {t('matty.wear')}
                </button>
              )}
            </div>
          ) : null}
          {resultExtra?.(outcome)}
          {stars === 0 ? <p>{t('res.hintOn')}</p> : null}
          <div className="btn-col">
            {onward ? (
              <button className="btn btn-primary btn-big" onClick={onward.go}>
                {onward.label} ➜
              </button>
            ) : null}
            <button
              className={`btn${onward ? '' : ' btn-primary btn-big'}`}
              onClick={() => {
                if (stars === 0) setHints(true)
                play()
              }}
            >
              <Icon name="retry" size={20} /> {t('res.retry')}
            </button>
            <button className="btn" onClick={back}>
              <Icon name="map" size={22} /> {t('res.map')}
            </button>
          </div>
        </div>
        {cupOpen && cupPlace ? (
          <CupModal
            stars={stars}
            copy={{ title: t('cup.title'), subtitle: `${mission} · ${cupPlace}`, tagline: t('cup.tagline'), site: window.location.host }}
            onClose={() => setCupOpen(false)}
          />
        ) : null}
      </div>
    )
  }

  return (
    <div className={`screen world-${kind} center${scene ? ' has-backdrop' : ''}`}>
      {backdrop}
      <div className="card intro-card">
        <button className="icon-btn intro-close" onClick={back} aria-label={t('back')}>
          ←
        </button>
        <small>{eyebrow}</small>
        <MattySays pose="point" size={86} className="brief">
          <span className="brief-icon">
            <KindIcon kind={kind} size={34} />
          </span>
          <strong>{mission}</strong>
          <SayButton text={briefing} />
        </MattySays>
        <HowSteps steps={steps} />
        <label className="toggle">
          <input type="checkbox" checked={hints} onChange={(e) => setHints(e.target.checked)} />
          <span>💡 {t('intro.hints')}</span>
        </label>
        <button className="btn btn-primary btn-big" onClick={play}>
          <Icon name="play" size={22} /> {t('intro.play')}
        </button>
      </div>
    </div>
  )
}

/** The cup picture, full size, with the buttons to keep it or send it. */
function CupModal({ stars, copy, onClose }: { stars: number; copy: CardCopy; onClose: () => void }) {
  const { t } = useT()
  const profile = useProfile()
  const card = useRef<SVGSVGElement>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<'saved' | 'error' | null>(null)
  const [shareable] = useState(canShareFile)

  const make = async (then: (blob: Blob) => Promise<void> | void) => {
    if (!card.current || busy) return
    setBusy(true)
    setNote(null)
    try {
      await then(await cardToPng(card.current, cardTexts(copy)))
    } catch (e) {
      // Closing the share sheet without sending is not an error.
      if ((e as Error)?.name !== 'AbortError') setNote('error')
    }
    setBusy(false)
  }

  return (
    <Modal onClose={onClose}>
      <TrophyCard ref={card} tier={tierFor(stars)} stars={stars} look={profile.look} copy={copy} />
      <div className="btn-row">
        {shareable ? (
          <button
            className="btn btn-primary"
            disabled={busy}
            onClick={() =>
              void make(async (blob) => {
                await navigator.share({ files: [new File([blob], CARD_FILE, { type: 'image/png' })], title: 'Matty', text: `${t('cup.shareText')} ${window.location.origin}` })
              })
            }
          >
            📤 {t('cup.share')}
          </button>
        ) : null}
        <button
          className={`btn${shareable ? '' : ' btn-primary'}`}
          disabled={busy}
          onClick={() =>
            void make((blob) => {
              downloadBlob(blob)
              setNote('saved')
            })
          }
        >
          📥 {t('cup.download')}
        </button>
        <button className="btn" onClick={onClose}>
          {t('back')}
        </button>
      </div>
      {note ? <p className={note === 'error' ? 'error' : 'done-today'}>{t(note === 'error' ? 'class.error' : 'cup.saved')}</p> : null}
    </Modal>
  )
}

/** A stop on the map. Now and then something bursts in before the level starts. */
export function StopScreen({ index }: { index: number }) {
  const { t } = useT()
  const profile = useProfile()
  const stop = JOURNEY[index]
  const full = getLevel(stop.kind, profile.band, stop.level)
  // The very first visits to the first stops are short: a quick win before the full-length levels.
  const [warmUp] = useState(() => index < WARM_UP_STOPS && stopPlays(profile, stop) === 0)
  const cfg = warmUp && 'rounds' in full ? { ...full, rounds: Math.min(full.rounds, WARM_UP_ROUNDS) } : full
  const [event, setEvent] = useState(() => rollEvent())
  // Decided once on arrival, so finishing the level does not change how it is presented.
  const [startWithHints] = useState(() => stopPlays(profile, stop) > 0 && stopStars(profile, stop) === 0)
  const [firstTime] = useState(() => isNewKind(profile, stop.kind))

  useEffect(() => {
    if (event) playMusic('arena')
  }, [event])

  if (event)
    return (
      <div className={`screen zone-${stop.zone} event-screen`}>
        <DodgeGame
          specs={eventSpecs(profile.band, stop.zone)}
          zone={stop.zone}
          profile={profile}
          onFinish={(results, ms) => {
            finishEvent(results, ms)
            setEvent(false)
          }}
        />
      </div>
    )

  return (
    <Activity
      cfg={cfg}
      scene={stop.zone}
      eyebrow={`${ZONE_ICON[stop.zone]} ${t(`zone.${stop.zone}`)} · ${stop.boss ? `👑 ${t('level.boss')}` : t('level.n', { n: (index % 10) + 1 })}`}
      startWithHints={startWithHints}
      firstTime={firstTime}
      save={(result) => finishStop(index, result)}
      cupPlace={`${t(`zone.${stop.zone}`)} · ${stop.boss ? t('level.boss') : t('level.n', { n: (index % 10) + 1 })}`}
      resultExtra={(o) => (stop.boss && o.stars > 0 ? <p className="level-up">{t('res.zoneDone', { zone: t(`zone.${stop.zone}`) })}</p> : null)}
      next={() =>
        // Read the saved state: the level just finished may have opened the next stop.
        index + 1 < JOURNEY.length && isStopOpen(profile, index + 1)
          ? { label: t('res.next'), go: () => go({ id: 'play', stop: index + 1 }, { replace: true }) }
          : null
      }
    />
  )
}

/** The teacher's theme of the week: each visit plays a different activity on the same idea. */
export function HomeworkScreen() {
  const { t } = useT()
  const profile = useProfile()
  const [hw] = useState(() => activeHomework(profile))
  const topic = hw ? TOPIC_BY_ID[hw.topic] : undefined
  // Fixed for this visit; "play again" keeps the same activity, the next visit rotates.
  const [turn, setTurn] = useState(() => (profile.hw?.id === hw?.id ? (profile.hw?.plays ?? 0) : 0))

  useEffect(() => {
    if (!hw || !topic) go({ id: 'class' }, { replace: true })
  }, [hw, topic])
  if (!hw || !topic) return null

  const cfg = topic.activities[turn % topic.activities.length]
  return (
    <Activity
      key={turn}
      cfg={cfg}
      eyebrow={`📚 ${t('class.homework')} · ${t(`topic.${hw.topic}` as 'topic.n20')}`}
      startWithHints={false}
      firstTime={false}
      save={(result) => finishHomework(hw, cfg.kind, result)}
      resultExtra={() => {
        const stars = Math.min(homeworkStars(profile, hw), hw.goal)
        return (
          <p className="level-up">
            📚 {stars >= hw.goal ? t('class.hwDone') : t('class.hwProgress', { n: stars, goal: hw.goal })}
          </p>
        )
      }}
      next={() => ({ label: t('class.hwAnother'), go: () => setTurn(turn + 1) })}
    />
  )
}

/** A stop of an extra world: one of the ready-made themes, or the teacher's own exercises. */
export function WorldStopScreen({ src, index }: { src: 'class' | 'season'; index: number }) {
  const { t } = useT()
  const profile = useProfile()
  const season = useSeason()
  // Fixed on arrival: a new world from the teacher must not swap the exercises mid-game.
  const [world] = useState(() => (src === 'class' ? classWorld(profile) : seasonWorldOf(profile, season)))
  const stop = world?.stops[index]
  const [turn, setTurn] = useState(() => (world ? (worldRecord(profile, world).plays[index] ?? 0) : 0))
  const topic = stop?.t === 'topic' ? TOPIC_BY_ID[stop.topic] : undefined

  useEffect(() => {
    if (!world || !stop) go({ id: 'hub' }, { replace: true })
  }, [world, stop])
  if (!world || !stop) return null

  const name = src === 'class' ? world.name : t(`season.${season?.id ?? 'xmas'}.world`)
  const cfg: PlayCfg = topic ? topic.activities[turn % topic.activities.length] : { kind: 'quiz', items: stop.t === 'own' ? stop.items : [] }
  const last = index + 1 >= world.stops.length
  return (
    <Activity
      key={turn}
      cfg={cfg}
      scene={world.scene}
      title={stop.t === 'topic' ? t(`topic.${stop.topic}` as 'topic.n20') : undefined}
      eyebrow={`${SCENE_ICON[world.scene]} ${name} · ${t('level.n', { n: index + 1 })}`}
      startWithHints={false}
      firstTime={false}
      save={(result) =>
        finishWorldStop(
          world,
          index,
          cfg.kind,
          result,
          cfg.kind === 'quiz' ? result.facts.filter((f) => !f.correct).map((f) => Number(f.key.slice(1))) : null,
        )
      }
      // The teacher's title stays off the picture children may share.
      cupPlace={`${src === 'class' ? t('world.class') : name} · ${t('level.n', { n: index + 1 })}`}
      resultExtra={(o) => (o.gifts.length ? null : last && o.stars > 0 ? <p className="level-up">🎉 {t('world.done')}</p> : null)}
      next={() =>
        !last && isWorldStopOpen(profile, world, index + 1)
          ? { label: t('res.next'), go: () => go({ id: 'worldplay', src, stop: index + 1 }, { replace: true }) }
          : topic
            ? { label: t('class.hwAnother'), go: () => setTurn(turn + 1) }
            : null
      }
    />
  )
}
