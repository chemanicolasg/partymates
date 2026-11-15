import { useMemo, useRef, useState } from 'react'
import { sfx } from '../core/audio'
import { fmtQty } from '../core/format'
import { genBlocksRound, minPieces, type BlocksRound } from '../core/generators'
import type { BlocksCfg } from '../core/types'
import { useT } from '../i18n'
import { Feedback, Hud, ProfileAvatar, Qty, SayButton, useTimeouts } from '../ui/kit'
import { useRun, type GameProps } from './run'

type Phase = 'build' | 'checking' | 'good' | 'short' | 'long'
const MAX_PER_PIECE = 30
/** Share of the scene taken by each cliff; the river fills the rest. */
const CLIFF = 15
const RIVER = 100 - 2 * CLIFF

export function BridgeGame({ cfg, profile, hints, onFinish, onExit }: GameProps<BlocksCfg>) {
  const { t, lang } = useT()
  const run = useRun(cfg.rounds, onFinish)
  const later = useTimeouts()
  const seen = useRef(new Set<number>())
  const newRound = (): BlocksRound => {
    const r = genBlocksRound(cfg, Math.random, seen.current)
    seen.current.add(cfg.partial ? r.start : r.target)
    return r
  }
  const [round, setRound] = useState<BlocksRound>(newRound)
  const [counts, setCounts] = useState<number[]>(() => cfg.pieces.map(() => 0))
  const [phase, setPhase] = useState<Phase>('build')
  const [tries, setTries] = useState(0)
  const [tip, setTip] = useState(false)

  const added = counts.reduce((s, c, i) => s + c * cfg.pieces[i], 0)
  const total = round.start + added
  const used = counts.reduce((s, c) => s + c, 0)
  const best = useMemo(() => minPieces(round.target - round.start, cfg.pieces), [round, cfg.pieces])
  const showTotal = hints || tries >= 2
  const showBridge = cfg.preview || phase !== 'build'
  const q = (v: number) => fmtQty(v, cfg.unit, cfg.den, lang)

  const change = (i: number, delta: number) => {
    if (phase !== 'build') return
    const next = counts[i] + delta
    if (next < 0 || next > MAX_PER_PIECE) return
    sfx(delta > 0 ? 'add' : 'remove')
    setCounts(counts.map((c, j) => (j === i ? next : c)))
  }

  const build = () => {
    if (phase !== 'build' || used === 0) return
    sfx('tap')
    setPhase('checking')
    later(() => {
      if (total === round.target) {
        sfx('good')
        setTip(used > best)
        setPhase('good')
        const over = run.record(tries === 0)
        later(() => {
          if (over) return run.finish()
          setRound(newRound())
          setCounts(cfg.pieces.map(() => 0))
          setTries(0)
          setPhase('build')
        }, used > best ? 2600 : 1700)
      } else {
        sfx('bad')
        setPhase(total < round.target ? 'short' : 'long')
        setTries(tries + 1)
        later(() => setPhase('build'), 1900)
      }
    }, 750)
  }

  const ratio = Math.min(total / round.target, 1.22)
  const startRatio = round.start / round.target
  const heroLeft =
    phase === 'good' ? 100 - CLIFF / 2 : phase === 'short' ? CLIFF + ratio * RIVER : phase === 'long' ? CLIFF + RIVER * 0.5 : CLIFF / 2
  const ask = cfg.unit === 'pct' ? 'blocks.askPct' : cfg.unit === 'int' ? 'blocks.ask' : 'blocks.askM'
  const prompt = cfg.partial ? t(`${ask}Partial`, { s: q(round.start), n: q(round.target) }) : t(ask, { n: q(round.target) })
  // Concrete stage: the river shows one slot per block, so the gap can be counted with a finger.
  const slots = cfg.preview && cfg.unit === 'int' && round.target <= 20 ? round.target : 0

  return (
    <div className="game game-blocks">
      <Hud onExit={onExit} results={run.results} total={cfg.rounds} />
      <p className="prompt">
        {prompt}
        <SayButton text={prompt} />
      </p>

      <div className={`bridge-scene phase-${phase}`}>
        <div className="cliff left" style={{ width: `${CLIFF}%` }} />
        <div className="cliff right" style={{ width: `${CLIFF}%` }}>
          <span className="sign">
            🚩 <Qty v={round.target} unit={cfg.unit} den={cfg.den} lang={lang} />
          </span>
        </div>
        <div className="river" style={{ left: `${CLIFF}%`, width: `${RIVER}%` }} />
        {slots ? (
          <div className="slots" style={{ left: `${CLIFF}%`, width: `${RIVER}%` }} aria-hidden="true">
            {Array.from({ length: slots }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        ) : null}
        {round.start > 0 ? (
          <div className="bridge old" style={{ left: `${CLIFF}%`, width: `${startRatio * RIVER}%` }}>
            <span>
              <Qty v={round.start} unit={cfg.unit} den={cfg.den} lang={lang} />
            </span>
          </div>
        ) : null}
        <div
          className="bridge new"
          style={{
            left: `${CLIFF + startRatio * RIVER}%`,
            width: showBridge ? `${(ratio - startRatio) * RIVER}%` : 0,
          }}
        />
        <div className="hero" style={{ left: `${heroLeft}%` }}>
          <ProfileAvatar p={profile} size={46} />
        </div>
        {phase === 'short' ? <span className="splash" style={{ left: `${heroLeft}%` }}>💦</span> : null}
      </div>

      <div className="status-line">
        {phase === 'good' ? (
          <Feedback kind="good">{tip ? t('blocks.tip', { n: best }) : t('fb.good')}</Feedback>
        ) : phase === 'short' ? (
          <Feedback kind="bad">{showTotal ? t('blocks.shortBy', { n: q(round.target - total) }) : t('blocks.short')}</Feedback>
        ) : phase === 'long' ? (
          <Feedback kind="bad">{showTotal ? t('blocks.longBy', { n: q(total - round.target) }) : t('blocks.long')}</Feedback>
        ) : showTotal ? (
          <Feedback kind="info">
            {t('blocks.total')} <Qty v={total} unit={cfg.unit} den={cfg.den} lang={lang} />
          </Feedback>
        ) : null}
      </div>

      <div className="tray">
        {cfg.pieces.map((p, i) => (
          <div className="piece-col" key={p}>
            <div className="piece-stack" aria-hidden="true">
              {Array.from({ length: Math.min(counts[i], 10) }, (_, k) => (
                <i key={k} className={`mini rank-${cfg.pieces.length - 1 - i}`} />
              ))}
            </div>
            <span className={`piece-count${counts[i] ? ' on' : ''}`}>×{counts[i]}</span>
            <button
              className={`piece rank-${cfg.pieces.length - 1 - i}`}
              onClick={() => change(i, 1)}
              aria-label={`+ ${q(p)}`}
            >
              <Qty v={p} unit={cfg.unit} den={cfg.den} lang={lang} />
            </button>
            <button className="piece-minus" onClick={() => change(i, -1)} disabled={!counts[i]} aria-label={`− ${q(p)}`}>
              −
            </button>
          </div>
        ))}
      </div>

      <button className="btn btn-primary btn-big" onClick={build} disabled={phase !== 'build' || used === 0}>
        🔨 {t('blocks.build')}
      </button>
    </div>
  )
}
