import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { sfx, sfxStreak } from '../core/audio'
import { fmtNum, fmtQty, fracParts } from '../core/format'
import { Icon } from './icons'
import { MattyFace } from './Matty'
import { PadButton, Scratchpad } from './Scratchpad'
import { getState } from '../core/store'
import type { Lang, Unit } from '../core/types'
import { useT } from '../i18n'

export function Stars({ n, max = 3, big }: { n: number; max?: number; big?: boolean }) {
  return (
    <span className={`stars${big ? ' big' : ''}`} aria-label={`${n}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < n ? 'star on' : 'star'} style={{ animationDelay: `${i * 0.25}s` }}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 1.8l3 6.300 6.900.9-5 4.800 1.200 6.900L12 17.400 5.900 20.700l1.200-6.900-5-4.800 6.900-.9z" />
          </svg>
        </span>
      ))}
    </span>
  )
}

/** A quantity in the level's unit: whole number, decimal, percentage or a stacked fraction. */
export function Qty({ v, unit, den, lang }: { v: number; unit: Unit; den: number; lang: Lang }) {
  if (unit !== 'frac') return <>{fmtQty(v, unit, den, lang)}</>
  const f = fracParts(v, den)
  return (
    <span className="qty" aria-label={fmtQty(v, unit, den, lang)}>
      {f.whole || !f.num ? <span>{f.whole}</span> : null}
      {f.num ? <Frac n={f.num} d={f.den} /> : null}
    </span>
  )
}

export function Frac({ n, d }: { n: number; d: number }) {
  return (
    <span className="frac" aria-label={`${n}/${d}`}>
      <span>{n}</span>
      <span>{d}</span>
    </span>
  )
}

export function Numpad({ onKey, okLabel, disabled }: { onKey: (key: string) => void; okLabel?: string; disabled?: boolean }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok']
  return (
    <div className="numpad">
      {keys.map((k) =>
        k === 'ok' && okLabel === undefined ? (
          <span key={k} />
        ) : (
          <button
            key={k}
            className={`key${k === 'ok' ? ' key-ok' : ''}${k === 'del' ? ' key-del' : ''}`}
            disabled={disabled}
            aria-label={k === 'del' ? '⌫' : k === 'ok' ? okLabel : k}
            onClick={() => {
              sfx('tap')
              onKey(k)
            }}
          >
            {k === 'del' ? '⌫' : k === 'ok' ? okLabel : k}
          </button>
        ),
      )}
    </div>
  )
}

/** Lets a game's top bar ask Matty for help: switches the on-screen hints on and shows a tip. */
export const HelpContext = createContext<{ tip: string; ask: () => void } | null>(null)

function MattyHelp() {
  const help = useContext(HelpContext)
  const { t, lang } = useT()
  const [open, setOpen] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  if (!help) return null
  return (
    <>
      <button
        className={`icon-btn matty-btn${open ? ' on' : ''}`}
        aria-label={t('matty.help')}
        onClick={() => {
          sfx('star')
          help.ask()
          setOpen(true)
          speak(help.tip, lang)
          clearTimeout(timer.current)
          timer.current = window.setTimeout(() => setOpen(false), 7000)
        }}
      >
        <MattyFace pose="think" size={34} />
      </button>
      {open ? (
        <button className="matty-tip" onClick={() => setOpen(false)}>
          <MattyFace pose="happy" size={44} />
          <span>
            {help.tip} <small>{t('matty.helpOn')}</small>
          </span>
        </button>
      ) : null}
    </>
  )
}

/** Top bar of every mini-game: exit, one pip per round, Matty's hint, the notepad and any extra (timer…). */
export function Hud({
  onExit,
  results,
  total,
  pad = true,
  children,
}: {
  onExit: () => void
  results: boolean[]
  total: number
  /** Offer the notepad for working things out by hand. */
  pad?: boolean
  children?: ReactNode
}) {
  const { t } = useT()
  // Right answers in a row, counted back from the latest one.
  let streak = 0
  while (streak < results.length && results[results.length - 1 - streak]) streak++
  useEffect(() => {
    if (streak >= 2) sfxStreak(streak)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.length])
  return (
    <header className="hud">
      {streak >= 2 ? (
        <span className="streak" key={results.length} role="status" aria-label={t('streak', { n: streak })}>
          🔥 ×{streak}
        </span>
      ) : null}
      <button className="icon-btn" onClick={onExit} aria-label={t('exit')}>
        ✕
      </button>
      <div className="pips" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={results.length}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`pip${i < results.length ? (results[i] ? ' ok' : ' ko') : i === results.length ? ' now' : ''}`} />
        ))}
      </div>
      {children}
      <MattyHelp />
      {pad ? <PadButton /> : null}
      {pad ? <Scratchpad /> : null}
    </header>
  )
}

/**
 * The task, in large print at the top of every game. Numbers are picked out as chips so the
 * figures that matter jump out even for children who are still slow readers.
 */
export function Prompt({ text, children }: { text: string; children?: ReactNode }) {
  const parts = text.split(/(−?\d+(?:[.,]\d+)?(?:\/\d+)?(?:\s?%)?)/)
  return (
    <p className="prompt">
      <span>
        {children ??
          parts.map((part, i) =>
            i % 2 ? (
              <b className="num" key={i}>
                {part}
              </b>
            ) : (
              part
            ),
          )}
      </span>
      <SayButton text={text} />
    </p>
  )
}

/** Three pictograms that show how an activity is played, for the card before it starts. */
export function HowSteps({ steps }: { steps: { icon: string; text: string }[] }) {
  return (
    <ol className="how-steps">
      {steps.map((s, i) => (
        <li key={i}>
          <span className="how-icon" aria-hidden="true">
            {s.icon}
          </span>
          <span>{s.text}</span>
        </li>
      ))}
    </ol>
  )
}

const VOICES: Record<Lang, string> = { ca: 'ca-ES', es: 'es-ES', en: 'en-GB' }
const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window

/** Reads a text aloud with the device's own voice, so children who cannot read yet can still play. */
export function speak(text: string, lang: Lang) {
  if (!canSpeak() || !getState().sound) return
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = VOICES[lang]
    utterance.rate = 0.92
    window.speechSynthesis.speak(utterance)
  } catch {
    /* no voice installed: the text is still on screen */
  }
}

export function SayButton({ text }: { text: string }) {
  const { t, lang } = useT()
  if (!canSpeak()) return null
  return (
    <button type="button" className="say" onClick={() => speak(text, lang)} aria-label={t('say')}>
      <Icon name="sound" size={20} />
    </button>
  )
}

export function Feedback({ kind, children }: { kind: 'good' | 'bad' | 'info'; children: ReactNode }) {
  return (
    <div className={`feedback ${kind}`} role="status">
      <MattyFace pose={kind === 'good' ? 'cheer' : kind === 'bad' ? 'oops' : 'happy'} size={30} />
      <span>{children}</span>
    </div>
  )
}

export function Modal({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

const CONFETTI = ['#ffd23f', '#ff4d6d', '#5cc8ff', '#6fe3a5', '#b06cff', '#ff9f43']

export function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      dur: 1.6 + Math.random() * 1.4,
      color: CONFETTI[i % CONFETTI.length],
      rot: Math.random() * 360,
    })),
  )
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i
          key={i}
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
    </div>
  )
}

export function TopBar({ title, onBack, children }: { title: ReactNode; onBack?: () => void; children?: ReactNode }) {
  const { t } = useT()
  return (
    <header className="topbar">
      {onBack ? (
        <button className="icon-btn" onClick={onBack} aria-label={t('back')}>
          ←
        </button>
      ) : null}
      <h1>{title}</h1>
      <div className="topbar-right">{children}</div>
    </header>
  )
}

export function Chip({ icon, children, label }: { icon: ReactNode; children: ReactNode; label?: string }) {
  return (
    <span className="chip" aria-label={label}>
      <span aria-hidden="true">{icon}</span>
      {children}
    </span>
  )
}

/** Counts up to a number so rewards feel earned. */
export function CountUp({ to, lang }: { to: number; lang: Lang }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / 900)
      setV(Math.round(to * k))
      if (k < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [to])
  return <>{fmtNum(v, lang)}</>
}

/** setTimeout that is cleared automatically when the component goes away. */
export function useTimeouts() {
  const ids = useRef<number[]>([])
  useEffect(() => () => ids.current.forEach((id) => clearTimeout(id)), [])
  return (fn: () => void, ms: number) => {
    ids.current.push(window.setTimeout(fn, ms))
  }
}
