import { useEffect, useRef, useState } from 'react'
import { sfx } from '../core/audio'
import { fmtNum, OP_SYMBOL } from '../core/format'
import { fuse, genArenaRound, type ArenaRound } from '../core/generators'
import { setMusicTempo } from '../core/music'
import type { ArenaCfg } from '../core/types'
import { useT } from '../i18n'
import { Feedback, Hud, useTimeouts } from '../ui/kit'
import { useRun, type GameProps } from './run'

type Phase = 'play' | 'good' | 'bad' | 'over'
const ENEMIES = ['🤖', '👾', '🛸', '🦾', '👹', '🐙', '🦂', '🧟', '👻', '🐉']

export function ArenaGame({ cfg, profile, hints, onFinish, onExit }: GameProps<ArenaCfg>) {
  const { t, lang } = useT()
  const run = useRun(cfg.rounds, onFinish)
  const later = useTimeouts()
  const seen = useRef(new Set<string>())
  const newRound = (): ArenaRound => {
    const r = genArenaRound(cfg, profile.facts, Math.random, seen.current)
    seen.current.add(r.fact.key)
    return r
  }
  const [round, setRound] = useState<ArenaRound>(newRound)
  const [selected, setSelected] = useState<number[]>([])
  const [phase, setPhase] = useState<Phase>('play')
  const [tries, setTries] = useState(0)
  const [left, setLeft] = useState(cfg.seconds * 1000)
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  // The storm closes in: the clock only runs while the player can act.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (phaseRef.current === 'play') setLeft((v) => v - 200)
    }, 200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (left <= 0 && phase === 'play') {
      sfx('bad')
      setPhase('over')
      later(() => run.finish(), 1800)
    }
  })

  // The music hurries up with the storm when time is running out.
  const hurry = left < cfg.seconds * 250
  useEffect(() => {
    setMusicTempo(hurry ? 1.18 : 1)
    return () => setMusicTempo(1)
  }, [hurry])

  const tap = (i: number) => {
    if (phase !== 'play') return
    sfx('tap')
    if (selected.includes(i)) return setSelected(selected.filter((s) => s !== i))
    const next = [...selected, i]
    setSelected(next)
    if (next.length < 2) return
    const ok = fuse(round.op, round.cards[next[0]], round.cards[next[1]]) === round.target
    later(() => {
      if (ok) {
        sfx('zap')
        setPhase('good')
        const over = run.record(tries === 0, round.fact)
        later(() => {
          if (over) return run.finish()
          setRound(newRound())
          setSelected([])
          setTries(0)
          setPhase('play')
        }, 800)
      } else {
        sfx('bad')
        setPhase('bad')
        setTries(tries + 1)
        later(() => {
          setSelected([])
          setPhase('play')
        }, 1300)
      }
    }, 180)
  }

  const x = selected.length > 0 ? round.cards[selected[0]] : null
  const y = selected.length > 1 ? round.cards[selected[1]] : null
  // Order never matters to the player: the bigger card always goes first for − and ÷.
  const [first, second] =
    x !== null && y !== null && (round.op === 'sub' || round.op === 'div') && y > x ? [y, x] : [x, y]
  const result = x !== null && y !== null ? fuse(round.op, x, y) : null
  const showPair = hints || tries >= 2
  const pair = showPair ? solution(round) : []
  const pct = Math.max(0, (left / (cfg.seconds * 1000)) * 100)
  const enemy = ENEMIES[run.results.length % ENEMIES.length]

  return (
    <div className={`game game-arena phase-${phase}`}>
      <Hud onExit={onExit} results={run.results} total={cfg.rounds} />
      <div className={`storm${pct < 25 ? ' low' : ''}`} aria-label={t('arena.storm')}>
        <span>🌩️</span>
        <div className="storm-bar">
          <i style={{ width: `${pct}%` }} />
        </div>
        <span className="storm-time">{Math.ceil(Math.max(0, left) / 1000)}</span>
      </div>

      <div className="enemy-zone">
        <div className="enemy" key={run.results.length}>
          <span className="enemy-body">{phase === 'good' ? '💥' : enemy}</span>
          <span className="shield">
            <small>🛡️</small>
            {fmtNum(round.target, lang)}
          </span>
        </div>
      </div>

      <div className="fusion card">
        <span className={`slot${first !== null ? ' full' : ''}`}>{first !== null ? fmtNum(first, lang) : ''}</span>
        <span className="op">{OP_SYMBOL[round.op]}</span>
        <span className={`slot${second !== null ? ' full' : ''}`}>{second !== null ? fmtNum(second, lang) : ''}</span>
        <span className="op">=</span>
        <span className={`slot result${phase === 'good' ? ' ok' : phase === 'bad' ? ' ko' : ''}`}>
          {result === null ? '⚡' : Number.isNaN(result) ? '✕' : fmtNum(result, lang)}
        </span>
      </div>

      <div className="status-line">
        {phase === 'good' ? <Feedback kind="good">{t('arena.hit')}</Feedback> : null}
        {phase === 'bad' ? <Feedback kind="bad">{t('arena.miss', { n: fmtNum(round.target, lang) })}</Feedback> : null}
        {phase === 'over' ? <Feedback kind="bad">{t('arena.timeUp')}</Feedback> : null}
        {phase === 'play' ? <Feedback kind="info">{t(`arena.how.${round.op}`, { n: fmtNum(round.target, lang) })}</Feedback> : null}
      </div>

      <div className="hand">
        {round.cards.map((c, i) => (
          <button
            key={`${run.results.length}-${i}`}
            className={`power-card${selected.includes(i) ? ' selected' : ''}${pair.includes(i) ? ' glow' : ''}`}
            onClick={() => tap(i)}
            disabled={phase !== 'play'}
          >
            <small>⚡</small>
            {fmtNum(c, lang)}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Indices of a pair of cards that breaks the shield (shown as a hint after two misses). */
function solution(round: ArenaRound): number[] {
  for (let i = 0; i < round.cards.length; i++)
    for (let j = i + 1; j < round.cards.length; j++)
      if (fuse(round.op, round.cards[i], round.cards[j]) === round.target) return [i, j]
  return []
}
