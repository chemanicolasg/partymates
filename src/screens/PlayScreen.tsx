import { useEffect, useRef, useState, type ReactNode } from 'react'
import { sfx } from '../core/audio'
import { eventSpecs, getLevel, JOURNEY } from '../core/curriculum'
import { playMusic, type TrackId } from '../core/music'
import { back, go } from '../core/nav'
import { playerLevel } from '../core/scoring'
import {
  activeHomework,
  finishEvent,
  finishHomework,
  finishStop,
  homeworkStars,
  isNewKind,
  isStopOpen,
  rollEvent,
  stopPlays,
  stopStars,
  useProfile,
  type Profile,
} from '../core/store'
import { ITEM_BY_ID, itemName } from '../core/look'
import { TOPIC_BY_ID } from '../core/topics'
import type { GameResult, Kind, LevelCfg } from '../core/types'
import { ArenaGame } from '../games/ArenaGame'
import { BayGame } from '../games/BayGame'
import { BridgeGame } from '../games/BridgeGame'
import { DodgeGame } from '../games/DodgeGame'
import { PairsGame } from '../games/PairsGame'
import { RaceGame } from '../games/RaceGame'
import { StonesGame } from '../games/StonesGame'
import { useT } from '../i18n'
import { Character } from '../ui/Character'
import { Confetti, CountUp, HelpContext, HowSteps, Modal, SayButton, speak, Stars } from '../ui/kit'
import { Matty, MattySays } from '../ui/Matty'
import { canShareFile, CARD_FILE, cardTexts, cardToPng, downloadBlob, tierFor, Trophy, TrophyCard, type CardCopy } from '../ui/Trophy'
import { HOW_ICONS, KIND_ICON, ZONE_ICON } from './art'

const MUSIC: Record<Kind, TrackId> = { blocks: 'blocks', party: 'party', arena: 'arena', bay: 'bay', stones: 'blocks', pairs: 'party' }

interface Outcome {
  result: GameResult
  stars: number
  coins: number
  xp: number
  leveledUp: boolean
  /** Items unlocked by the stars of this level: Matty's presents. */
  gifts: string[]
}

function Game({ cfg, ...props }: { cfg: LevelCfg; profile: Profile; hints: boolean; firstTime: boolean; onFinish: (r: GameResult) => void; onExit: () => void }) {
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
  next,
}: {
  cfg: LevelCfg
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
  const briefing = `${t(`mission.${kind}`)}. ${steps.map((s) => s.text).join('. ')}.`

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
      <div className={`screen world-${kind}`} key={attempt}>
        <HelpContext.Provider value={{ tip: t(`tip.${kind}`), ask: () => setHints(true) }}>
          <Game cfg={cfg} profile={profile} hints={hints} firstTime={firstTime && attempt === 1} onFinish={onFinish} onExit={back} />
        </HelpContext.Provider>
      </div>
    )

  if (phase === 'result' && outcome) {
    const { stars, result } = outcome
    const onward = next?.(outcome) ?? null
    return (
      <div className={`screen world-${kind} center`}>
        {stars > 0 ? <Confetti /> : null}
        <div className="card result-card">
          <Matty pose={stars >= 2 ? 'cheer' : stars === 1 ? 'happy' : 'oops'} size={116} bounce={stars > 0} />
          <h1>{t(`res.s${stars}` as 'res.s0')}</h1>
          <Stars n={stars} big />
          <p className="result-score">{t('res.score', { ok: result.correct, total: result.total })}</p>
          <div className="result-loot">
            <span>
              🪙 +<CountUp to={outcome.coins} lang={lang} />
            </span>
            <span>
              ⚡ +<CountUp to={outcome.xp} lang={lang} />
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
              🔁 {t('res.retry')}
            </button>
            <button className="btn" onClick={back}>
              🗺️ {t('res.map')}
            </button>
          </div>
        </div>
        {cupOpen && cupPlace ? (
          <CupModal
            stars={stars}
            copy={{ title: t('cup.title'), subtitle: `${t(`mission.${kind}`)} · ${cupPlace}`, tagline: t('cup.tagline'), site: window.location.host }}
            onClose={() => setCupOpen(false)}
          />
        ) : null}
      </div>
    )
  }

  return (
    <div className={`screen world-${kind} center`}>
      <div className="card intro-card">
        <button className="icon-btn intro-close" onClick={back} aria-label={t('back')}>
          ←
        </button>
        <small>{eyebrow}</small>
        <MattySays pose="point" size={86} className="brief">
          <span className="brief-icon">{KIND_ICON[kind]}</span>
          <strong>{t(`mission.${kind}`)}</strong>
          <SayButton text={briefing} />
        </MattySays>
        <HowSteps steps={steps} />
        <label className="toggle">
          <input type="checkbox" checked={hints} onChange={(e) => setHints(e.target.checked)} />
          <span>💡 {t('intro.hints')}</span>
        </label>
        <button className="btn btn-primary btn-big" onClick={play}>
          ▶ {t('intro.play')}
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
  const cfg = getLevel(stop.kind, profile.band, stop.level)
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
