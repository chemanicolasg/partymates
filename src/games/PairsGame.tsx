import { useRef, useState } from 'react'
import { sfx } from '../core/audio'
import { fmtNum, OP_SYMBOL } from '../core/format'
import { genPairsBoard, shuffle } from '../core/generators'
import type { Fact, PairsCfg } from '../core/types'
import { useT } from '../i18n'
import { Feedback, Hud, Prompt, useTimeouts } from '../ui/kit'
import { useRun, type GameProps } from './run'

interface Board {
  facts: Fact[]
  /** The results, shuffled independently of the operations. */
  results: number[]
}

const COLORS = ['#ffd23f', '#6fe3a5', '#5cc8ff', '#ff8fb8', '#b99bff', '#ffb347']

/** Match each operation with its result. A pair counts when it is right at the first try. */
export function PairsGame({ cfg, profile, hints, firstTime, onFinish, onExit }: GameProps<PairsCfg>) {
  const { t, lang } = useT()
  const total = cfg.pairs * cfg.boards
  const run = useRun(total, onFinish)
  const later = useTimeouts()
  const seen = useRef(new Set<string>())
  const deal = (): Board => {
    const facts = genPairsBoard(cfg, profile.facts, Math.random, seen.current)
    facts.forEach((f) => seen.current.add(f.key))
    return { facts, results: shuffle(facts.map((f) => f.answer)) }
  }
  const [board, setBoard] = useState<Board>(deal)
  const [op, setOp] = useState<number | null>(null)
  const [res, setRes] = useState<number | null>(null)
  /** Operation index → order in which it was matched (for the colour). */
  const [matched, setMatched] = useState<Record<number, number>>({})
  const [missed, setMissed] = useState<Record<number, boolean>>({})
  const [flash, setFlash] = useState<'ok' | 'ko' | null>(null)

  const matchedCount = Object.keys(matched).length
  const resultTaken = (value: number) => board.facts.some((f, i) => matched[i] !== undefined && f.answer === value)

  const judge = (o: number, r: number) => {
    const fact = board.facts[o]
    if (fact.answer === board.results[r]) {
      sfx('good')
      setFlash('ok')
      const nextMatched = { ...matched, [o]: matchedCount }
      setMatched(nextMatched)
      const over = run.record(!missed[o], fact)
      later(() => {
        setOp(null)
        setRes(null)
        setFlash(null)
        if (over) return run.finish()
        if (Object.keys(nextMatched).length === board.facts.length) {
          setBoard(deal())
          setMatched({})
          setMissed({})
        }
      }, 650)
    } else {
      sfx('bad')
      setFlash('ko')
      setMissed({ ...missed, [o]: true })
      later(() => {
        setOp(null)
        setRes(null)
        setFlash(null)
      }, 900)
    }
  }

  const pickOp = (i: number) => {
    if (flash || matched[i] !== undefined) return
    sfx('tap')
    setOp(i)
    if (res !== null) judge(i, res)
  }
  const pickRes = (i: number) => {
    if (flash || resultTaken(board.results[i])) return
    sfx('tap')
    setRes(i)
    if (op !== null) judge(op, i)
  }

  return (
    <div className="game game-pairs">
      <Hud onExit={onExit} results={run.results} total={total} />
      <Prompt text={t('pairs.ask')} />
      <div className="pairs-board">
        <div className="pairs-col">
          {board.facts.map((f, i) => {
            const order = matched[i]
            return (
              <button
                key={`${f.key}-${i}`}
                className={`pair-card op${op === i ? ` selected${flash ? ` ${flash}` : ''}` : ''}${order !== undefined ? ' matched' : ''}${
                  firstTime && run.results.length === 0 && op === null && i === 0 ? ' nudge' : ''
                }`}
                style={order !== undefined ? { background: COLORS[order % COLORS.length] } : undefined}
                onClick={() => pickOp(i)}
                disabled={order !== undefined}
              >
                {fmtNum(f.a, lang)} {OP_SYMBOL[f.op]} {fmtNum(f.b, lang)}
              </button>
            )
          })}
        </div>
        <div className="pairs-link" aria-hidden="true">
          {op !== null && res === null ? '👉' : '🔗'}
        </div>
        <div className="pairs-col">
          {board.results.map((value, i) => {
            const owner = board.facts.findIndex((f, k) => matched[k] !== undefined && f.answer === value)
            // With hints on, the partner of the chosen operation lights up.
            const glow = hints && op !== null && flash === null && board.facts[op].answer === value
            return (
              <button
                key={`${value}-${i}`}
                className={`pair-card res${res === i ? ` selected${flash ? ` ${flash}` : ''}` : ''}${owner >= 0 ? ' matched' : ''}${glow ? ' glow' : ''}`}
                style={owner >= 0 ? { background: COLORS[matched[owner] % COLORS.length] } : undefined}
                onClick={() => pickRes(i)}
                disabled={owner >= 0}
              >
                {fmtNum(value, lang)}
              </button>
            )
          })}
        </div>
      </div>
      <div className="status-line">
        {flash === 'ok' ? <Feedback kind="good">{t('fb.good')}</Feedback> : null}
        {flash === 'ko' ? <Feedback kind="bad">{t('pairs.wrong')}</Feedback> : null}
      </div>
    </div>
  )
}
