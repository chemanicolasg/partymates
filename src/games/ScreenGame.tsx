import { useEffect, useMemo, useRef, useState } from 'react'
import { sfx } from '../core/audio'
import { fmtNum, OP_SYMBOL } from '../core/format'
import { buildTask, LINE_TOLERANCE, scoreTask, TASKS, type Dot, type TaskId, type TaskScore, type TrialResult } from '../core/screening'
import type { Profile } from '../core/store'
import { useT } from '../i18n'
import { TASK_ICON } from '../screens/art'
import { Numpad, SayButton, speak, useTimeouts } from '../ui/kit'

function Dots({ dots }: { dots: Dot[] }) {
  return (
    <svg viewBox="0 0 100 70" className="dot-field" aria-hidden="true">
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} />
      ))}
    </svg>
  )
}

/**
 * The five stations of the Explorer Mission. Practice items show whether the answer was right so
 * the child understands the task; the measured items never do, and there is no clock on screen:
 * the point is to see how the child handles numbers, not to make them nervous.
 */
export function ScreenGame({
  profile,
  onFinish,
  onExit,
}: {
  profile: Profile
  onFinish: (tasks: Record<TaskId, TaskScore>, ms: number) => void
  onExit: () => void
}) {
  const { t, lang } = useT()
  const later = useTimeouts()
  const [taskIndex, setTaskIndex] = useState(0)
  const [stage, setStage] = useState<'intro' | 'run'>('intro')
  const [index, setIndex] = useState(0)
  const [feedback, setFeedback] = useState<'ok' | 'ko' | 'next' | null>(null)
  const [typed, setTyped] = useState('')
  const [mark, setMark] = useState<number | null>(null)
  const task = TASKS[taskIndex]
  const { practice, trials } = useMemo(() => buildTask(task, profile.band), [task, profile.band])
  const trial = trials[index]
  const practising = index < practice
  const results = useRef<TrialResult[]>([])
  const scores = useRef<Partial<Record<TaskId, TaskScore>>>({})
  const started = useRef(Date.now())
  const shown = useRef(Date.now())
  const how = t(`screen.${task}.how`)

  // The youngest hear each instruction as its card appears.
  useEffect(() => {
    if (stage === 'intro' && profile.band === 'A') speak(how, lang)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskIndex, stage])

  const advance = () => {
    setFeedback(null)
    setTyped('')
    setMark(null)
    shown.current = Date.now()
    if (index + 1 < trials.length) return setIndex(index + 1)
    scores.current[task] = scoreTask(task, results.current)
    results.current = []
    if (taskIndex + 1 >= TASKS.length) return onFinish(scores.current as Record<TaskId, TaskScore>, Date.now() - started.current)
    setTaskIndex(taskIndex + 1)
    setIndex(0)
    setStage('intro')
  }

  const answer = (ok: boolean, error?: number) => {
    if (feedback) return
    const ms = Date.now() - shown.current
    if (practising) {
      sfx(ok ? 'good' : 'tap')
      setFeedback(ok ? 'ok' : 'ko')
      later(advance, ok ? 1100 : 2400)
    } else {
      results.current.push({ ok, ms, error })
      sfx('tap')
      setFeedback('next')
      later(advance, 320)
    }
  }

  const onKey = (key: string) => {
    if (feedback || trial.task !== 'facts') return
    if (key === 'del') return setTyped(typed.slice(0, -1))
    const next = typed + key
    setTyped(next)
    if (next.length >= String(trial.answer).length) answer(Number(next) === trial.answer)
  }

  const placeMark = (e: React.PointerEvent<HTMLDivElement>) => {
    if (feedback || trial.task !== 'line') return
    const box = e.currentTarget.getBoundingClientRect()
    setMark(Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)))
  }

  const stations = (
    <div className="stations" aria-hidden="true">
      {TASKS.map((k, i) => (
        <span key={k} className={i < taskIndex ? 'done' : i === taskIndex ? 'now' : ''}>
          {i < taskIndex ? '✔' : TASK_ICON[k]}
        </span>
      ))}
    </div>
  )

  if (stage === 'intro')
    return (
      <div className="game game-screen center-col">
        {stations}
        <div className="card intro-card">
          <button className="icon-btn intro-close" onClick={onExit} aria-label={t('exit')}>
            ✕
          </button>
          <span className="result-art">{TASK_ICON[task]}</span>
          <h1>{t(`screen.${task}.title`)}</h1>
          <p>
            {how} <SayButton text={how} />
          </p>
          <button
            className="btn btn-primary btn-big"
            onClick={() => {
              sfx('tap')
              shown.current = Date.now()
              setStage('run')
            }}
          >
            ▶ {t('screen.go')}
          </button>
        </div>
      </div>
    )

  const reveal = feedback === 'ko'
  return (
    <div className={`game game-screen task-${task}`}>
      {stations}
      <div className="pips">
        {trials.slice(practice).map((_, i) => (
          <span key={i} className={`pip${i < index - practice ? ' ok' : i === index - practice ? ' now' : ''}`} />
        ))}
      </div>
      <p className="screen-ask">
        {practising ? <b className="practice-tag">{t('screen.practice')}</b> : null}
        {trial.task === 'line' ? t('screen.line.ask', { n: fmtNum(trial.target, lang) }) : t(`screen.${task}.title`)}
      </p>

      <div className="screen-stage" key={`${taskIndex}-${index}`}>
        {trial.task === 'dots' ? <Dots dots={trial.dots} /> : null}

        {trial.task === 'cmpDots' ? (
          <div className="screen-pair">
            {(['left', 'right'] as const).map((s) => (
              <button key={s} className={`screen-side${reveal && trial.answer === s ? ' answer' : ''}`} onClick={() => answer(trial.answer === s)} aria-label={s}>
                <Dots dots={trial[s]} />
              </button>
            ))}
          </div>
        ) : null}

        {trial.task === 'cmpNum' ? (
          <div className="screen-pair">
            {(['left', 'right'] as const).map((s) => (
              <button key={s} className={`screen-side number${reveal && trial.answer === s ? ' answer' : ''}`} onClick={() => answer(trial.answer === s)}>
                {fmtNum(trial[s], lang)}
              </button>
            ))}
          </div>
        ) : null}

        {trial.task === 'line' ? (
          <div className="number-line">
            <div className="line-track" onPointerDown={placeMark}>
              {mark !== null ? <i className="line-mark" style={{ left: `${mark * 100}%` }} /> : null}
              {reveal ? <i className="line-mark true" style={{ left: `${(trial.target / trial.max) * 100}%` }} /> : null}
            </div>
            <div className="line-ends">
              <span>0</span>
              <span>{fmtNum(trial.max, lang)}</span>
            </div>
          </div>
        ) : null}

        {trial.task === 'facts' ? (
          <div className="dojo-fact card">
            <span>{trial.a}</span>
            <span className="op">{OP_SYMBOL[trial.op]}</span>
            <span>{trial.b}</span>
            <span className="op">=</span>
            <span className="dojo-input">{reveal ? trial.answer : typed || '?'}</span>
          </div>
        ) : null}
      </div>

      <div className="status-line">
        {feedback === 'ok' ? <span className="feedback good">{t('screen.practiceOk')}</span> : null}
        {feedback === 'ko' ? <span className="feedback info">{t('screen.practiceKo')}</span> : null}
        {feedback === 'next' ? <span className="screen-thumb">👍</span> : null}
      </div>

      {trial.task === 'dots' ? (
        <div className="count-keys">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
            <button key={n} className={`key${reveal && trial.answer === n ? ' key-ok' : ''}`} onClick={() => answer(trial.answer === n)} disabled={feedback !== null}>
              {n}
            </button>
          ))}
        </div>
      ) : null}
      {trial.task === 'line' ? (
        <button
          className="btn btn-primary btn-big"
          disabled={mark === null || feedback !== null}
          onClick={() => {
            if (mark === null) return
            const error = Math.abs(mark - trial.target / trial.max)
            answer(error <= LINE_TOLERANCE, error)
          }}
        >
          ✔ {t('screen.ready')}
        </button>
      ) : null}
      {trial.task === 'facts' ? <Numpad onKey={onKey} disabled={feedback !== null} /> : null}
    </div>
  )
}
