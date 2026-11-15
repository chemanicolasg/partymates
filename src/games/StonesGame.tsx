import { useState } from 'react'
import { sfx } from '../core/audio'
import { fmtNum, OP_SYMBOL } from '../core/format'
import { genStonesRound, type Stone } from '../core/generators'
import type { StonesCfg } from '../core/types'
import { useT } from '../i18n'
import { ProfileAvatar } from '../ui/Character'
import { Feedback, Hud, Prompt, Qty, useTimeouts } from '../ui/kit'
import { useRun, type GameProps } from './run'

/** Cross the river: hop on the stones in order, smallest first (or largest first). */
export function StonesGame({ cfg, profile, hints, onFinish, onExit }: GameProps<StonesCfg>) {
  const { t, lang } = useT()
  const run = useRun(cfg.rounds, onFinish)
  const later = useTimeouts()
  const [stones, setStones] = useState<Stone[]>(() => genStonesRound(cfg))
  /** Indices of the stones already hopped on, in order. */
  const [path, setPath] = useState<number[]>([])
  const [wrong, setWrong] = useState<number | null>(null)
  const [slips, setSlips] = useState(0)
  const [done, setDone] = useState(false)

  const order = stones.map((_, i) => i).sort((a, b) => (cfg.desc ? stones[b].value - stones[a].value : stones[a].value - stones[b].value))
  const next = order[path.length]

  const hop = (i: number) => {
    if (done || path.includes(i) || wrong !== null) return
    if (i !== next) {
      sfx('bad')
      setWrong(i)
      setSlips(slips + 1)
      later(() => setWrong(null), 700)
      return
    }
    sfx('add')
    const reached = [...path, i]
    setPath(reached)
    if (reached.length < stones.length) return
    sfx('good')
    setDone(true)
    const over = run.record(slips === 0)
    later(() => {
      if (over) return run.finish()
      setStones(genStonesRound(cfg))
      setPath([])
      setSlips(0)
      setDone(false)
    }, 1500)
  }

  return (
    <div className="game game-stones">
      <Hud onExit={onExit} results={run.results} total={cfg.rounds} />
      <Prompt text={t(cfg.desc ? 'stones.askDesc' : 'stones.ask')} />
      <div className="stones-legend" aria-hidden="true">
        <span className={cfg.desc ? 'big' : 'small'}>●</span>
        <span>➜</span>
        <span className={cfg.desc ? 'small' : 'big'}>●</span>
      </div>

      <div className="river-crossing">
        <div className="bank start">{path.length === 0 ? <ProfileAvatar p={profile} size={44} bounce /> : null}</div>
        <div className="stones">
          {stones.map((s, i) => {
            const at = path.indexOf(i)
            const here = at === path.length - 1 && at >= 0
            // After a few slips (or with hints on) the next stone lights up.
            const glow = (hints || slips >= 3) && i === next && !done
            return (
              <button
                key={i}
                className={`stone${at >= 0 ? ' done' : ''}${wrong === i ? ' wrong' : ''}${glow ? ' glow' : ''}`}
                style={{ animationDelay: `${i * -0.7}s` }}
                onClick={() => hop(i)}
                disabled={at >= 0}
              >
                {here ? (
                  <span className="stone-hero">
                    <ProfileAvatar p={profile} size={38} />
                  </span>
                ) : null}
                {at >= 0 ? <small>{at + 1}</small> : null}
                <strong>
                  {s.fact ? (
                    `${fmtNum(s.fact.a, lang)} ${OP_SYMBOL[s.fact.op]} ${fmtNum(s.fact.b, lang)}`
                  ) : (
                    <Qty v={s.value} unit={cfg.unit} den={cfg.den} lang={lang} />
                  )}
                </strong>
              </button>
            )
          })}
        </div>
        <div className="bank end">🏁</div>
      </div>

      <div className="status-line">
        {done ? <Feedback kind="good">{t('fb.good')}</Feedback> : null}
        {wrong !== null ? <Feedback kind="bad">{t(cfg.desc ? 'stones.wrongDesc' : 'stones.wrong')}</Feedback> : null}
      </div>
    </div>
  )
}
