import { useEffect, useRef, useState } from 'react'
import { sfx } from '../core/audio'
import { fmtNum, OP_SYMBOL } from '../core/format'
import { genDojoSheet } from '../core/generators'
import type { Profile } from '../core/store'
import type { DojoStep, Fact, FactResult } from '../core/types'
import { useT } from '../i18n'
import { Hud, Numpad, useTimeouts } from '../ui/kit'

/** Daily speed sheet: twelve quick facts against the clock (Kumon-style fluency practice). */
export function DojoGame({
  step,
  profile,
  onFinish,
  onExit,
}: {
  step: DojoStep
  profile: Profile
  onFinish: (results: FactResult[], ms: number, missed: Fact[]) => void
  onExit: () => void
}) {
  const { t, lang } = useT()
  const later = useTimeouts()
  const [sheet] = useState(() => genDojoSheet(step, profile.facts))
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [state, setState] = useState<'play' | 'ok' | 'ko'>('play')
  const [flags, setFlags] = useState<boolean[]>([])
  const [elapsed, setElapsed] = useState(0)
  const results = useRef<FactResult[]>([])
  const missed = useRef<Fact[]>([])
  const started = useRef(Date.now())
  const factStarted = useRef(Date.now())
  const fact = sheet[index]

  useEffect(() => {
    const id = window.setInterval(() => setElapsed(Date.now() - started.current), 250)
    return () => clearInterval(id)
  }, [])

  const answer = (text: string) => {
    const ok = Number(text) === fact.answer
    const now = Date.now()
    results.current.push({ key: fact.key, correct: ok, ms: now - factStarted.current })
    if (!ok) missed.current.push(fact)
    setFlags([...flags, ok])
    setState(ok ? 'ok' : 'ko')
    sfx(ok ? 'coin' : 'bad')
    later(() => {
      factStarted.current = Date.now()
      if (index + 1 >= sheet.length) return onFinish(results.current, Date.now() - started.current, missed.current)
      setIndex(index + 1)
      setInput('')
      setState('play')
    }, ok ? 280 : 1400)
  }

  const onKey = (key: string) => {
    if (state !== 'play') return
    if (key === 'del') return setInput(input.slice(0, -1))
    const next = input + key
    setInput(next)
    // The answer is checked as soon as it has as many digits as the solution: no "enter" to slow the flow.
    if (next.length >= String(fact.answer).length) answer(next)
  }

  const sec = Math.floor(elapsed / 1000)
  const pct = Math.min(100, (elapsed / (step.targetSec * 1000)) * 100)

  return (
    <div className="game game-dojo">
      <Hud onExit={onExit} results={flags} total={sheet.length} pad={false} />
      <div className={`storm${pct >= 100 ? ' low' : ''}`}>
        <span>⏱️</span>
        <div className="storm-bar">
          <i style={{ width: `${pct}%` }} />
        </div>
        <span className="storm-time">
          {sec}/{step.targetSec}
        </span>
      </div>
      <div className="dojo-stage">
        <div className={`dojo-fact card ${state}`} key={index}>
          <span>{fmtNum(fact.a, lang)}</span>
          <span className="op">{OP_SYMBOL[fact.op]}</span>
          <span>{fmtNum(fact.b, lang)}</span>
          <span className="op">=</span>
          <span className="dojo-input">{state === 'ko' ? fmtNum(fact.answer, lang) : input || '?'}</span>
        </div>
        <p className="dojo-note">{state === 'ko' ? t('dojo.remember') : ' '}</p>
      </div>
      <Numpad onKey={onKey} disabled={state !== 'play'} />
    </div>
  )
}

/** Concrete picture of a fact (dot arrays and groups) for reviewing slips: see it before memorising it. */
export function FactPicture({ fact }: { fact: Fact }) {
  const whole = [fact.a, fact.b, fact.answer].every((v) => Number.isInteger(v) && v >= 0)
  if (!whole) return null
  if (fact.op === 'mul' || fact.op === 'div') {
    const rows = fact.op === 'mul' ? Math.min(fact.a, fact.b) : fact.b
    const cols = fact.op === 'mul' ? Math.max(fact.a, fact.b) : fact.answer
    if (rows > 12 || cols > 15) return null
    return (
      <span className="dots array" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} aria-hidden="true">
        {Array.from({ length: rows * cols }, (_, i) => (
          <i key={i} className={Math.floor(i / cols) % 2 ? 'alt' : ''} />
        ))}
      </span>
    )
  }
  const total = fact.op === 'add' ? fact.answer : fact.a
  if (total > 40) return null
  const first = fact.op === 'add' ? fact.a : fact.answer
  return (
    <span className="dots" style={{ gridTemplateColumns: `repeat(10, 1fr)` }} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={i < first ? '' : fact.op === 'add' ? 'alt' : 'gone'} />
      ))}
    </span>
  )
}
