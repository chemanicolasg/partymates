import { useState } from 'react'
import { sfx } from '../core/audio'
import { DOJO, DOJO_SHEET } from '../core/curriculum'
import { fmtNum, OP_SYMBOL } from '../core/format'
import { back } from '../core/nav'
import { dayKey } from '../core/scoring'
import { finishDojo, useProfile, type DojoOutcome } from '../core/store'
import type { Fact, FactResult } from '../core/types'
import { DojoGame, FactPicture } from '../games/DojoGame'
import { useT } from '../i18n'
import { Confetti, Stars } from '../ui/kit'
import { Matty } from '../ui/Matty'

export function DojoScreen() {
  const { t, lang } = useT()
  const profile = useProfile()
  const [phase, setPhase] = useState<'intro' | 'game' | 'result'>('intro')
  const [attempt, setAttempt] = useState(0)
  // The sheet just played: after levelling up the profile already points at the next one.
  const [played, setPlayed] = useState(profile.dojo.step)
  const [outcome, setOutcome] = useState<(DojoOutcome & { missed: Fact[] }) | null>(null)
  const step = DOJO[phase === 'result' ? played : profile.dojo.step]
  const best = profile.dojo.best[step.id]
  const doneToday = profile.dojo.lastDay === dayKey()

  const start = () => {
    sfx('tap')
    setPlayed(profile.dojo.step)
    setAttempt(attempt + 1)
    setPhase('game')
  }
  const onFinish = (results: FactResult[], ms: number, missed: Fact[]) => {
    const o = finishDojo(results, ms)
    sfx(o.passed ? 'win' : 'star')
    setOutcome({ ...o, missed })
    setPhase('result')
  }

  if (phase === 'game')
    return (
      <div className="screen world-dojo" key={attempt}>
        <DojoGame step={step} profile={profile} onFinish={onFinish} onExit={back} />
      </div>
    )

  if (phase === 'result' && outcome) {
    const accurate = outcome.correct / outcome.total >= 0.9
    return (
      <div className="screen world-dojo center">
        {outcome.passed ? <Confetti /> : null}
        <div className="card result-card">
          <Matty pose={outcome.passed ? 'cheer' : accurate ? 'happy' : 'think'} size={110} bounce={outcome.passed} />
          <h1>{t(outcome.passed ? 'dojo.passed' : accurate ? 'dojo.faster' : 'dojo.again')}</h1>
          <Stars n={outcome.passed ? 3 : accurate ? 2 : outcome.correct >= outcome.total / 2 ? 1 : 0} big />
          <div className="result-loot">
            <span>✔ {outcome.correct}/{outcome.total}</span>
            <span>
              ⏱️ {outcome.sec}s / {step.targetSec}s
            </span>
          </div>
          <div className="result-loot">
            <span>🪙 +{outcome.coins}</span>
            <span>⚡ +{outcome.xp}</span>
            <span>🔥 {outcome.streak}</span>
          </div>
          {outcome.leveledUp ? (
            <p className="level-up">
              🎉 {t('dojo.newSheet')} <b>{DOJO[profile.dojo.step].label}</b>
            </p>
          ) : null}
          {outcome.missed.length ? (
            <div className="missed">
              <p>{t('dojo.review')}</p>
              {outcome.missed.slice(0, 3).map((f, i) => (
                <div className="missed-fact" key={i}>
                  <strong>
                    {fmtNum(f.a, lang)} {OP_SYMBOL[f.op]} {fmtNum(f.b, lang)} = {fmtNum(f.answer, lang)}
                  </strong>
                  <FactPicture fact={f} />
                </div>
              ))}
            </div>
          ) : null}
          <div className="btn-col">
            <button className="btn btn-primary btn-big" onClick={start}>
              🔁 {t('dojo.oneMore')}
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
    <div className="screen world-dojo center">
      <div className="card intro-card">
        <button className="icon-btn intro-close" onClick={back} aria-label={t('back')}>
          ←
        </button>
        <span className="result-art">⚡</span>
        <small>
          {t('dojo.title')} · {t('dojo.sheet', { n: profile.dojo.step + 1, total: DOJO.length })}
        </small>
        <h1 className="dojo-label">{step.label}</h1>
        <p>{t('dojo.how', { n: DOJO_SHEET, sec: step.targetSec })}</p>
        <div className="result-loot">
          <span>🔥 {t('dojo.streak', { n: profile.dojo.streak })}</span>
          {best !== undefined ? <span>🏅 {best}s</span> : null}
        </div>
        {doneToday ? <p className="done-today">✔ {t('dojo.doneToday')}</p> : null}
        <button className="btn btn-primary btn-big" onClick={start}>
          ▶ {t('intro.play')}
        </button>
      </div>
    </div>
  )
}
