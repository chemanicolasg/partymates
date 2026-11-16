import { useMemo, useState } from 'react'
import { sfx } from '../core/audio'
import { shuffle } from '../core/generators'
import type { Fact, QuizCfg } from '../core/types'
import { isRight, isTyped, optionsFor } from '../core/worlds'
import { useT } from '../i18n'
import { Feedback, Hud, Numpad, Prompt, useTimeouts } from '../ui/kit'
import { Matty } from '../ui/Matty'
import { useRun, type GameProps } from './run'

type Phase = 'play' | 'good' | 'bad' | 'reveal'
const MAX_TRIES = 2

/** Only the position of the exercise is recorded: the teacher sees which ones the class misses. */
const marker = (index: number): Fact => ({ op: 'add', a: 0, b: 0, answer: 0, key: `q${index}` })

/**
 * The teacher's own exercises, one at a time. Whole numbers are typed on the keypad; anything
 * else (decimals, negatives, words) is picked among three options.
 */
export function QuizGame({ cfg, onFinish, onExit }: GameProps<QuizCfg>) {
  const { t } = useT()
  const later = useTimeouts()
  const order = useMemo(() => shuffle(cfg.items.map((_, i) => i)), [cfg.items])
  const run = useRun(order.length, onFinish)
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<Phase>('play')
  const [tries, setTries] = useState(0)
  const [input, setInput] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const index = order[step]
  const [question, answer] = cfg.items[index]
  const typed = isTyped(answer)
  const options = useMemo(() => (typed ? [] : optionsFor(cfg.items[index], cfg.items)), [cfg.items, index, typed])

  const next = (over: boolean) => {
    if (over) return run.finish()
    setStep(step + 1)
    setTries(0)
    setInput('')
    setPicked(null)
    setPhase('play')
  }

  const judge = (given: string) => {
    if (phase !== 'play') return
    if (isRight(answer, given)) {
      sfx('good')
      setPhase('good')
      const over = run.record(tries === 0, marker(index))
      later(() => next(over), 1300)
    } else if (tries + 1 >= MAX_TRIES) {
      sfx('bad')
      setPhase('reveal')
      const over = run.record(false, marker(index))
      later(() => next(over), 2600)
    } else {
      sfx('bad')
      setPhase('bad')
      setTries(tries + 1)
      later(() => {
        setInput('')
        setPicked(null)
        setPhase('play')
      }, 1400)
    }
  }

  const onKey = (key: string) => {
    if (phase !== 'play') return
    if (key === 'del') return setInput(input.slice(0, -1))
    if (key === 'ok') return input ? judge(input) : undefined
    if (input.length < 6) setInput(input + key)
  }

  return (
    <div className={`game game-quiz phase-${phase}`}>
      <Hud onExit={onExit} results={run.results} total={order.length} />
      <Prompt text={question} />
      <div className="quiz-stage">
        <Matty pose={phase === 'good' ? 'cheer' : phase === 'bad' || phase === 'reveal' ? 'oops' : 'think'} size={92} />
        <div className={`quiz-answer card${phase === 'good' ? ' ok' : phase === 'bad' ? ' ko' : ''}`} key={step}>
          {phase === 'reveal' ? answer : typed ? input || '?' : (picked ?? '?')}
        </div>
      </div>
      <div className="status-line">
        {phase === 'good' ? <Feedback kind="good">{t('fb.good')}</Feedback> : null}
        {phase === 'bad' ? <Feedback kind="bad">{t('fb.retry')}</Feedback> : null}
        {phase === 'reveal' ? (
          <Feedback kind="info">
            {t('fb.solution')} {answer}
          </Feedback>
        ) : null}
      </div>
      {typed ? (
        <Numpad onKey={onKey} okLabel="✔" disabled={phase !== 'play'} />
      ) : (
        <div className={`dodge-options quiz-options${options.some((o) => o.length > 6) ? ' stack' : ''}`}>
          {options.map((o) => (
            <button
              key={o}
              className={`dodge-option${picked === o ? (phase === 'good' ? ' ok' : ' ko') : ''}${phase === 'reveal' && isRight(answer, o) ? ' answer' : ''}`}
              disabled={phase !== 'play'}
              onClick={() => {
                setPicked(o)
                judge(o)
              }}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
