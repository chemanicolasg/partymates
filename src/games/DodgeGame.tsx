import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { sfx } from '../core/audio'
import { fmtNum, OP_SYMBOL } from '../core/format'
import { genChoice, type Choice } from '../core/generators'
import type { Profile } from '../core/store'
import type { Band, FactResult, FactSpec, ZoneId } from '../core/types'
import { useT } from '../i18n'
import { ProfileAvatar } from '../ui/Character'
import { Feedback, useTimeouts } from '../ui/kit'

/** What comes hurtling along in each zone. */
export const HAZARD: Record<ZoneId, string> = { beach: '🌊', jungle: '🥥', mountain: '🪨', space: '☄️' }
const ROUNDS = 5
/** Seconds each one takes to arrive: generous for the youngest. */
const SECONDS: Record<Band, number> = { A: 14, B: 11, C: 9, D: 8 }

type Phase = 'warning' | 'play' | 'good' | 'bad' | 'summary'

/** A surprise between levels: something huge rolls in and only a quick, right answer dodges it. */
export function DodgeGame({
  specs,
  zone,
  profile,
  onFinish,
}: {
  specs: FactSpec[]
  zone: ZoneId
  profile: Profile
  onFinish: (results: FactResult[], ms: number) => void
}) {
  const { t, lang } = useT()
  const later = useTimeouts()
  const seen = useRef(new Set<string>())
  const draw = (): Choice => {
    const c = genChoice(specs, profile.facts, Math.random, seen.current)
    seen.current.add(c.fact.key)
    return c
  }
  const [choice, setChoice] = useState<Choice>(draw)
  const [phase, setPhase] = useState<Phase>('warning')
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [dodged, setDodged] = useState(0)
  const results = useRef<FactResult[]>([])
  const started = useRef(Date.now())
  const asked = useRef(Date.now())
  const seconds = SECONDS[profile.band]

  // The warning flashes first; then the first one starts rolling.
  useEffect(() => {
    sfx('bad')
    const id = window.setTimeout(() => {
      asked.current = Date.now()
      setPhase('play')
    }, 2200)
    return () => clearTimeout(id)
  }, [])

  const resolve = (ok: boolean, value: number | null) => {
    if (phase !== 'play') return
    setPicked(value)
    sfx(ok ? 'zap' : 'bad')
    setPhase(ok ? 'good' : 'bad')
    if (ok) setDodged(dodged + 1)
    results.current.push({ key: choice.fact.key, correct: ok, ms: Date.now() - asked.current })
    later(() => {
      if (index + 1 >= ROUNDS) {
        sfx('win')
        setPhase('summary')
        later(() => onFinish(results.current, Date.now() - started.current), 2200)
        return
      }
      setChoice(draw())
      setIndex(index + 1)
      setPicked(null)
      asked.current = Date.now()
      setPhase('play')
    }, ok ? 1000 : 1900)
  }

  // Time is up when it reaches the player.
  useEffect(() => {
    if (phase !== 'play') return
    const id = window.setTimeout(() => resolve(false, null), seconds * 1000)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index])

  const { fact } = choice
  const hazard = HAZARD[zone]

  if (phase === 'warning')
    return (
      <div className="game game-dodge center-col">
        <div className="dodge-warning">
          <span className="dodge-big">{hazard}</span>
          <h1>{t(`event.${zone}`)}</h1>
          <p>{t('event.how')}</p>
        </div>
      </div>
    )

  if (phase === 'summary')
    return (
      <div className="game game-dodge center-col">
        <div className="card dodge-summary">
          <span className="dodge-big">{dodged >= 3 ? '🎉' : '💪'}</span>
          <h1>{t('event.done', { ok: dodged, total: ROUNDS })}</h1>
          <p className="result-loot">
            <span>🪙 +{dodged * 3}</span>
          </p>
        </div>
      </div>
    )

  return (
    <div className={`game game-dodge phase-${phase}`}>
      <div className="pips">
        {Array.from({ length: ROUNDS }, (_, i) => (
          <span key={i} className={`pip${i < results.current.length ? (results.current[i].correct ? ' ok' : ' ko') : i === index ? ' now' : ''}`} />
        ))}
      </div>
      <div className="dodge-question card" key={index}>
        <span>{fmtNum(fact.a, lang)}</span>
        <span className="op">{OP_SYMBOL[fact.op]}</span>
        <span>{fmtNum(fact.b, lang)}</span>
        <span className="op">=</span>
        <span className="dodge-ask">{phase === 'play' ? '?' : fmtNum(fact.answer, lang)}</span>
      </div>

      <div className="dodge-lane">
        <span className="dodge-hero">
          <ProfileAvatar p={profile} size={64} />
        </span>
        <span className="dodge-hazard" key={index} style={{ '--secs': `${seconds}s` } as CSSProperties}>
          {phase === 'good' ? '💥' : hazard}
        </span>
      </div>

      <div className="status-line">
        {phase === 'good' ? <Feedback kind="good">{t('event.dodged')}</Feedback> : null}
        {phase === 'bad' ? <Feedback kind="bad">{t('event.hit', { n: fmtNum(fact.answer, lang) })}</Feedback> : null}
      </div>

      <div className="dodge-options">
        {choice.options.map((v) => (
          <button
            key={v}
            className={`dodge-option${picked === v ? (phase === 'good' ? ' ok' : ' ko') : ''}${phase === 'bad' && v === fact.answer ? ' answer' : ''}`}
            onClick={() => resolve(v === fact.answer, v)}
            disabled={phase !== 'play'}
          >
            {fmtNum(v, lang)}
          </button>
        ))}
      </div>
    </div>
  )
}
