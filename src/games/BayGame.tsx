import { useRef, useState } from 'react'
import { sfx } from '../core/audio'
import { fmtNum } from '../core/format'
import { bayId, genBayRound, shuffle, type BayRound } from '../core/generators'
import { FRIENDS } from '../core/look'
import type { BayCfg } from '../core/types'
import { useT } from '../i18n'
import { Feedback, Frac, Hud, Numpad, Prompt, useTimeouts } from '../ui/kit'
import { useRun, type GameProps } from './run'

type Phase = 'play' | 'good' | 'bad' | 'reveal'
const MAX_TRIES = 3

export function BayGame({ cfg, hints, firstTime, onFinish, onExit }: GameProps<BayCfg>) {
  const { t, lang } = useT()
  const run = useRun(cfg.rounds, onFinish)
  const later = useTimeouts()
  const seen = useRef(new Set<string>())
  const newRound = (): BayRound => {
    const r = genBayRound(cfg, Math.random, seen.current)
    seen.current.add(bayId(r))
    return r
  }
  const [round, setRound] = useState<BayRound>(newRound)
  const [phase, setPhase] = useState<Phase>('play')
  const [tries, setTries] = useState(0)
  const [inputs, setInputs] = useState(['', ''])
  const [focus, setFocus] = useState(0)
  const [chests, setChests] = useState<number[]>(() => new Array(round.k).fill(0))
  const [message, setMessage] = useState<'unfair' | 'more' | 'wrong'>('wrong')
  const [friends] = useState(() => shuffle(FRIENDS))

  const two = round.answer2 !== undefined
  const pile = round.total - chests.reduce((a, b) => a + b, 0)
  const showModel = hints || tries >= 1

  const nextRound = (over: boolean) => {
    if (over) return run.finish()
    const r = newRound()
    setRound(r)
    setChests(new Array(r.k).fill(0))
    setInputs(['', ''])
    setFocus(0)
    setTries(0)
    setPhase('play')
  }

  const judge = (ok: boolean, why: typeof message = 'wrong') => {
    if (ok) {
      sfx('good')
      setPhase('good')
      const over = run.record(tries === 0, round.fact)
      later(() => nextRound(over), 1500)
    } else if (tries + 1 >= MAX_TRIES) {
      // After three tries we show the solution and move on: nobody gets stuck.
      sfx('bad')
      setPhase('reveal')
      setChests(new Array(round.k).fill(round.answer))
      setInputs([String(round.answer), String(round.answer2 ?? '')])
      const over = run.record(false, round.fact)
      later(() => nextRound(over), 2800)
    } else {
      sfx('bad')
      setMessage(why)
      setPhase('bad')
      setTries(tries + 1)
      later(() => {
        setPhase('play')
        if (!round.concrete) {
          setInputs(['', ''])
          setFocus(0)
        }
      }, 1500)
    }
  }

  // ── concrete stage: deal the gems by hand ──
  const give = (i: number, delta: number) => {
    if (phase !== 'play' || (delta > 0 && pile <= 0) || (delta < 0 && chests[i] <= 0)) return
    sfx(delta > 0 ? 'add' : 'remove')
    setChests(chests.map((c, j) => (j === i ? c + delta : c)))
  }
  const dealRound = () => {
    if (phase !== 'play' || pile < round.k) return
    sfx('coin')
    setChests(chests.map((c) => c + 1))
  }
  const checkChests = () => {
    const fair = chests.every((c) => c === chests[0])
    if (!fair) return judge(false, 'unfair')
    if (pile >= round.k) return judge(false, 'more')
    judge(true)
  }

  // ── abstract stage: type the answer ──
  const onKey = (key: string) => {
    if (phase !== 'play') return
    if (key === 'ok') {
      if (!inputs[0] || (two && !inputs[1])) return
      return judge(Number(inputs[0]) === round.answer && (!two || Number(inputs[1]) === round.answer2))
    }
    setInputs(inputs.map((v, i) => (i !== focus ? v : key === 'del' ? v.slice(0, -1) : v.length < 4 ? v + key : v)))
  }

  const n = (v: number) => fmtNum(v, lang)
  const params = { total: n(round.total), k: n(round.k), pct: n(round.pct), a: n(round.n), b: n(round.d) }
  const prompt = (
    <>
      {t('bay.fracA')} <Frac n={round.n} d={round.d} /> {t('bay.fracB', params)}
    </>
  )
  const spoken =
    round.t === 'frac'
      ? `${t('bay.fracA')} ${round.n}/${round.d} ${t('bay.fracB', params)}`
      : round.t === 'calc'
        ? t(`bay.calc.${round.op ?? 'add'}`, params)
        : t(round.t === 'share' ? (two ? 'bay.shareRem' : 'bay.share') : (`bay.${round.t}` as 'bay.groups'), params)
  const labels: [string, string] =
    round.t === 'ratio'
      ? [`🧑‍✈️ ${t('bay.captain')}`, `⚓ ${t('bay.sailor')}`]
      : round.t === 'groups'
        ? [`⛵ ${t('bay.boats')}`, '']
        : round.t === 'calc' && round.op !== 'div'
          ? [`🪙 ${t('bay.total')}`, '']
          : [`🎁 ${t(round.t === 'share' || round.t === 'calc' ? 'bay.each' : 'bay.take')}`, `🪙 ${t('bay.left')}`]

  return (
    <div className={`game game-bay phase-${phase}`}>
      <Hud onExit={onExit} results={run.results} total={cfg.rounds} />
      <Prompt text={spoken}>{round.t === 'frac' ? prompt : undefined}</Prompt>

      {round.concrete ? (
        <>
          <div className="pile card" aria-label={`${pile}`}>
            {pile > 0 ? Array.from({ length: pile }, (_, i) => <span key={i}>💎</span>) : <em>{t('bay.empty')}</em>}
          </div>
          <div className="chests">
            {chests.map((c, i) => (
              <div className="chest-col" key={i}>
                <span className="friend">{friends[i % friends.length]}</span>
                <button className="chest" onClick={() => give(i, 1)} aria-label={`+1 (${c})`}>
                  <span className="chest-gems">
                    {Array.from({ length: c }, (_, g) => (
                      <i key={g} />
                    ))}
                  </span>
                  {showModel || phase === 'reveal' ? <b>{c}</b> : null}
                </button>
                <button className="piece-minus" onClick={() => give(i, -1)} disabled={!c} aria-label="−1">
                  −
                </button>
              </div>
            ))}
          </div>
          <StatusLine phase={phase} message={message} round={round} />
          <div className="btn-row">
            <button className={`btn${firstTime && run.results.length === 0 && pile === round.total && phase === 'play' ? ' nudge' : ''}`} onClick={dealRound} disabled={phase !== 'play' || pile < round.k}>
              🔄 {t('bay.deal')}
            </button>
            <button className="btn btn-primary" onClick={checkChests} disabled={phase !== 'play' || pile === round.total}>
              ✔ {t('bay.done')}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="bay-visual">{showModel ? <BarModel round={round} reveal={phase === 'reveal'} lang={lang} /> : <Scene round={round} />}</div>
          <div className="answers">
            {[0, 1].slice(0, two ? 2 : 1).map((i) => (
              <button
                key={i}
                className={`answer-box${focus === i ? ' focus' : ''}${phase === 'good' ? ' ok' : phase === 'bad' ? ' ko' : ''}`}
                onClick={() => setFocus(i)}
              >
                <small>{labels[i]}</small>
                <strong>{inputs[i] || '?'}</strong>
              </button>
            ))}
          </div>
          <StatusLine phase={phase} message={message} round={round} />
          <Numpad onKey={onKey} okLabel="✔" disabled={phase !== 'play'} />
        </>
      )}
    </div>
  )
}

function StatusLine({ phase, message, round }: { phase: Phase; message: 'unfair' | 'more' | 'wrong'; round: BayRound }) {
  const { t, lang } = useT()
  return (
    <div className="status-line">
      {phase === 'good' ? <Feedback kind="good">{t('fb.good')}</Feedback> : null}
      {phase === 'bad' ? <Feedback kind="bad">{t(message === 'unfair' ? 'bay.unfair' : message === 'more' ? 'bay.more' : 'fb.retry')}</Feedback> : null}
      {phase === 'reveal' ? (
        <Feedback kind="info">
          {t('fb.solution')} {fmtNum(round.answer, lang)}
          {round.answer2 !== undefined ? ` · ${fmtNum(round.answer2, lang)}` : ''}
        </Feedback>
      ) : null}
    </div>
  )
}

/** Story picture shown before any hint: the loot and who it is for. */
function Scene({ round }: { round: BayRound }) {
  if (round.t === 'calc' && round.op !== 'div')
    return (
      <div className="bay-scene">
        <span className="loot">
          {round.op === 'mul' ? '🧰' : '🪙'} <b>{round.total}</b>
        </span>
        <span className="arrow">{round.op === 'add' ? '➕' : round.op === 'sub' ? '➖' : '✖️'}</span>
        <span className="loot">
          {round.op === 'sub' ? '🦜' : '🪙'} <b>{round.k}</b>
        </span>
      </div>
    )
  const sharing = round.t === 'share' || round.t === 'calc'
  const who = sharing ? '🧒'.repeat(Math.min(round.k, 10)) : round.t === 'groups' ? '⛵' : round.t === 'pct' ? '🦜' : '🏴‍☠️'
  return (
    <div className="bay-scene">
      <span className="loot">
        {sharing || round.t === 'groups' ? '💎' : '🪙'} <b>{round.total}</b>
      </span>
      <span className="arrow">➜</span>
      <span className="who">
        {who}
        {sharing && round.k > 10 ? <b> ×{round.k}</b> : null}
        {round.t === 'groups' ? <b> ×{round.k}💎</b> : null}
      </span>
    </div>
  )
}

/** Singapore-style bar model: the whole on top, equal parts below. */
function BarModel({ round, reveal, lang }: { round: BayRound; reveal: boolean; lang: 'ca' | 'es' | 'en' }) {
  if (round.t === 'calc' && round.op !== 'div') {
    // Part–whole picture of a one-step problem: the unknown box is the one to find.
    const n = (v: number) => fmtNum(v, lang)
    const ask = reveal ? n(round.answer) : '?'
    const many = round.op === 'mul' && round.total <= 12
    return (
      <div className="bar-model">
        <div className="bar-total">{round.op === 'sub' ? n(round.total) : ask}</div>
        <div className="bar-parts">
          {round.op === 'add' ? (
            <>
              <span className="marked">{n(round.total)}</span>
              <span className="other">{n(round.k)}</span>
            </>
          ) : round.op === 'sub' ? (
            <>
              <span className="other">{n(round.k)}</span>
              <span>{ask}</span>
            </>
          ) : many ? (
            Array.from({ length: round.total }, (_, i) => (
              <span key={i} className="marked">
                {n(round.k)}
              </span>
            ))
          ) : (
            <span className="marked">
              {n(round.total)} × {n(round.k)}
            </span>
          )}
        </div>
      </div>
    )
  }
  const parts =
    round.t === 'share' || round.t === 'calc' ? round.k : round.t === 'groups' ? round.answer : round.t === 'frac' ? round.d : round.t === 'pct' ? 100 / gcd(round.pct, 100) : round.n + round.d
  const marked = round.t === 'frac' ? round.n : round.t === 'pct' ? round.pct / gcd(round.pct, 100) : round.t === 'ratio' ? round.n : 0
  const each = round.t === 'groups' ? round.k : Math.floor((round.total - (round.t === 'share' ? (round.answer2 ?? 0) : 0)) / parts)
  // In "how many boats" problems the number of boxes is the answer, so it stays hidden until revealed.
  const boxes = round.t === 'groups' && !reveal ? 3 : Math.min(parts, 25)
  return (
    <div className="bar-model">
      <div className="bar-total">{fmtNum(round.total, lang)}</div>
      <div className="bar-parts">
        {Array.from({ length: boxes }, (_, i) => (
          <span key={i} className={`${i < marked ? 'marked' : ''}${round.t === 'ratio' && i >= marked ? ' other' : ''}`}>
            {round.t === 'groups' ? fmtNum(each, lang) : reveal ? fmtNum(each, lang) : '?'}
          </span>
        ))}
        {round.t === 'groups' && !reveal ? <span className="more">…</span> : null}
        {round.t === 'share' && round.answer2 ? <span className="rest">{reveal ? fmtNum(round.answer2, lang) : '+?'}</span> : null}
      </div>
    </div>
  )
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
