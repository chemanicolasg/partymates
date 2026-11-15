import { useState, type CSSProperties, type ReactNode } from 'react'
import { sfx } from '../core/audio'
import { fmtNum } from '../core/format'
import { genPartyRound, isFullBoard, partyStart, pick, type PartyRound } from '../core/generators'
import type { Lang, PartyCfg } from '../core/types'
import { useT } from '../i18n'
import { ProfileAvatar } from '../ui/Character'
import { Feedback, Hud, Prompt, useTimeouts } from '../ui/kit'
import { useRun, type GameProps } from './run'

type Phase = 'ready' | 'rolling' | 'choose' | 'good' | 'bad'

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

/** Small dice show pips (so little ones can subitise); anything else shows the number. */
function Die({ v, rolling, lang, hue }: { v: number | null; rolling: boolean; lang: Lang; hue: number }) {
  const pips = v !== null && PIPS[v]
  return (
    <span className={`die hue-${hue}${rolling ? ' rolling' : ''}`} aria-label={v === null ? '?' : String(v)}>
      {v === null ? (
        '?'
      ) : pips ? (
        <span className="pips-grid">
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i} className={pips.includes(i) ? 'on' : ''} />
          ))}
        </span>
      ) : (
        fmtNum(v, lang)
      )}
    </span>
  )
}

/** Dice board: roll, work out where you land, tap that square. Every perfect landing is a star. */
export function RaceGame({ cfg, profile, firstTime, onFinish, onExit }: GameProps<PartyCfg>) {
  const { t, lang } = useT()
  const run = useRun(cfg.rounds, onFinish)
  const later = useTimeouts()
  const full = isFullBoard(cfg)
  const [round, setRound] = useState<PartyRound>(() => genPartyRound(cfg, partyStart(cfg)))
  const [phase, setPhase] = useState<Phase>('ready')
  const [picked, setPicked] = useState<number | null>(null)
  const [flicker, setFlicker] = useState<number[]>([])
  const [landed, setLanded] = useState(0)
  // The token only leaves its square after a correct landing.
  const [pos, setPos] = useState(round.pos)

  const roll = () => {
    if (phase !== 'ready') return
    sfx('roll')
    setPhase('rolling')
    for (let i = 0; i < 6; i++) later(() => setFlicker(round.dice.map((_, d) => pick(cfg.dice[d]))), i * 90)
    later(() => setPhase('choose'), 620)
  }

  const choose = (v: number) => {
    if (phase !== 'choose' || v === pos) return
    const ok = v === round.dest
    setPicked(v)
    sfx(ok ? 'good' : 'bad')
    setPhase(ok ? 'good' : 'bad')
    if (ok) {
      setLanded(landed + 1)
      setPos(round.dest)
    }
    const over = run.record(ok, round.fact)
    later(() => {
      if (over) return run.finish()
      const next = genPartyRound(cfg, ok ? round.dest : pos)
      setRound(next)
      setPos(next.pos)
      setPicked(null)
      setPhase('ready')
    }, ok ? 1300 : 2300)
  }

  const rolled = phase !== 'ready' && phase !== 'rolling'
  const dieValue = (i: number) => (phase === 'ready' ? null : phase === 'rolling' ? (flicker[i] ?? null) : round.dice[i])
  const die = (i: number, key = `d${i}`) => <Die key={key} v={dieValue(i)} rolling={phase === 'rolling'} lang={lang} hue={i} />
  const op = (s: string, i: number) => (
    <span className="op" key={`o${i}${s}`}>
      {s}
    </span>
  )
  const wrap = (i: number): ReactNode =>
    rolled && round.dice[i] < 0 ? (
      <span className="paren" key={`p${i}`}>
        ({die(i)})
      </span>
    ) : (
      die(i)
    )

  const formula: ReactNode[] = [
    <span className="here" key="pos">
      📍{fmtNum(pos, lang)}
    </span>,
  ]
  switch (round.rule) {
    case 'sum':
      round.dice.forEach((_, i) => formula.push(op('+', i), wrap(i)))
      break
    case 'back':
      round.dice.forEach((_, i) => formula.push(op('−', i), wrap(i)))
      break
    case 'prod':
      formula.push(op('+', 0), wrap(0), op('×', 1), wrap(1))
      break
    case 'prodPlus':
      formula.push(op('+', 0), wrap(0), op('×', 1), wrap(1), op('+', 2), wrap(2))
      break
    case 'prodMinus':
      formula.push(op('+', 0), wrap(0), op('×', 1), wrap(1), op('−', 2), wrap(2))
      break
    case 'sumTimes':
      formula.push(op('+', 0), op('(', 0), wrap(0), op('+', 1), wrap(1), op(')', 1), op('×', 2), wrap(2))
      break
    case 'double':
      formula.push(op('+', 0), op('2 ×', 1), wrap(0))
      break
    case 'square':
      formula.push(op('+', 0), wrap(0), op('×', 1), die(0, 'd0b'))
      break
  }

  const tileClass = (v: number) =>
    `${v === pos ? ' here' : ''}${picked === v ? (phase === 'good' ? ' ok' : ' ko') : ''}${phase === 'bad' && v === round.dest ? ' answer' : ''}`
  const rule = t(`party.rule.${round.rule}`)

  return (
    <div className="game game-party">
      <Hud onExit={onExit} results={run.results} total={cfg.rounds}>
        <span className="chip">⭐ {landed}</span>
      </Hud>
      <Prompt text={round.warped && phase === 'ready' ? `${t('party.warp', { n: fmtNum(pos, lang) })} ${rule}` : `${rule} ${t('party.choose')}`} />

      <div className="rule-card card">
        <div className="formula">
          {formula}
          <span className="op">=</span>
          <span className="goal">❓</span>
        </div>
      </div>

      {full ? (
        <div className={`board${phase === 'choose' ? ' active' : ''}`} style={{ '--cols': cfg.max - cfg.min > 20 ? 10 : 5 } as CSSProperties}>
          {Array.from({ length: cfg.max - cfg.min + 1 }, (_, i) => cfg.min + i).map((v) => (
            <button key={v} className={`tile${tileClass(v)}`} onClick={() => choose(v)} disabled={phase !== 'choose'}>
              {v === pos ? <ProfileAvatar p={profile} size={30} /> : null}
              <span>{fmtNum(v, lang)}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className={`platforms${phase === 'choose' ? ' active' : ''}`}>
          {(round.options ?? []).map((v) => (
            <button key={v} className={`platform${tileClass(v)}`} onClick={() => choose(v)} disabled={phase !== 'choose'}>
              {fmtNum(v, lang)}
            </button>
          ))}
        </div>
      )}

      <div className="status-line">
        {phase === 'good' ? <Feedback kind="good">{t('party.landed')}</Feedback> : null}
        {phase === 'bad' ? <Feedback kind="bad">{t('party.missed', { n: fmtNum(round.dest, lang) })}</Feedback> : null}
      </div>

      <button className={`btn btn-primary btn-big${firstTime && run.results.length === 0 && phase === 'ready' ? ' nudge' : ''}`} onClick={roll} disabled={phase !== 'ready'}>
        🎲 {t('party.roll')}
      </button>
    </div>
  )
}
