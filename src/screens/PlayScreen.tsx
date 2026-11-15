import { useEffect, useState } from 'react'
import { sfx } from '../core/audio'
import { getLevel, levelKey } from '../core/curriculum'
import { back, go } from '../core/nav'
import { playerLevel } from '../core/scoring'
import { finishLevel, useProfile } from '../core/store'
import { LEVELS_PER_WORLD, type GameResult, type WorldId } from '../core/types'
import { ArenaGame } from '../games/ArenaGame'
import { BayGame } from '../games/BayGame'
import { BridgeGame } from '../games/BridgeGame'
import { RaceGame } from '../games/RaceGame'
import { useT } from '../i18n'
import { Confetti, CountUp, SayButton, speak, Stars } from '../ui/kit'
import { WORLD_ART } from './worlds'

interface Outcome {
  result: GameResult
  stars: number
  coins: number
  xp: number
  leveledUp: boolean
}

export function PlayScreen({ world, index }: { world: WorldId; index: number }) {
  const { t, lang } = useT()
  const profile = useProfile()
  const cfg = getLevel(world, profile.band, index)
  const record = profile.levels[levelKey(world, profile.band, index)]
  const [phase, setPhase] = useState<'intro' | 'game' | 'result'>('intro')
  // A child who could not pass the level last time starts with the helping hand switched on.
  const [hints, setHints] = useState(() => !!record && record.plays > 0 && record.stars === 0)
  const [attempt, setAttempt] = useState(0)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  const briefing = `${t(`mission.${world}`)} ${t(`how.${world}`)}`

  // The youngest players get the mission read out as soon as the card opens.
  useEffect(() => {
    if (profile.band === 'A') speak(briefing, lang)
    return () => window.speechSynthesis?.cancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onFinish = (result: GameResult) => {
    const before = playerLevel(profile.xp)
    const rewards = finishLevel(world, index, result)
    sfx(rewards.stars > 0 ? 'win' : 'bad')
    setOutcome({ result, ...rewards, leveledUp: playerLevel(profile.xp + rewards.xp) > before })
    setPhase('result')
  }
  const play = () => {
    sfx('tap')
    setAttempt(attempt + 1)
    setPhase('game')
  }

  if (phase === 'game') {
    const props = { profile, hints, onFinish, onExit: back }
    return (
      <div className={`screen world-${world}`} key={attempt}>
        {cfg.kind === 'blocks' ? <BridgeGame cfg={cfg} {...props} /> : null}
        {cfg.kind === 'party' ? <RaceGame cfg={cfg} {...props} /> : null}
        {cfg.kind === 'arena' ? <ArenaGame cfg={cfg} {...props} /> : null}
        {cfg.kind === 'bay' ? <BayGame cfg={cfg} {...props} /> : null}
      </div>
    )
  }

  if (phase === 'result' && outcome) {
    const { stars, result } = outcome
    const hasNext = stars > 0 && index + 1 < LEVELS_PER_WORLD
    const worldDone = stars > 0 && index + 1 === LEVELS_PER_WORLD
    return (
      <div className={`screen world-${world} center`}>
        {stars > 0 ? <Confetti /> : null}
        <div className="card result-card">
          <span className="result-art">{stars > 0 ? WORLD_ART[world].icon : '💪'}</span>
          <h1>{t(worldDone ? 'res.worldDone' : (`res.s${stars}` as 'res.s0'))}</h1>
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
          {stars === 0 ? <p>{t('res.hintOn')}</p> : null}
          <div className="btn-col">
            {hasNext ? (
              <button className="btn btn-primary btn-big" onClick={() => go({ id: 'play', world, index: index + 1 }, { replace: true })}>
                {t('res.next')} ➜
              </button>
            ) : null}
            <button
              className={`btn${hasNext ? '' : ' btn-primary btn-big'}`}
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
      </div>
    )
  }

  return (
    <div className={`screen world-${world} center`}>
      <div className="card intro-card">
        <button className="icon-btn intro-close" onClick={back} aria-label={t('back')}>
          ←
        </button>
        <span className="result-art">{WORLD_ART[world].icon}</span>
        <small>
          {t(`world.${world}`)} · {index + 1 === LEVELS_PER_WORLD ? `👑 ${t('level.boss')}` : t('level.n', { n: index + 1 })}
        </small>
        <h1>{t(`mission.${world}`)}</h1>
        <p>
          {t(`how.${world}`)}
          <SayButton text={briefing} />
        </p>
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
