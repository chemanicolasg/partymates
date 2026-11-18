import { useRef, useState, type CSSProperties } from 'react'
import { sfx } from '../core/audio'
import { fmtNum } from '../core/format'
import { launchBubbles, launchRefill, launchTarget } from '../core/launch'
import type { LaunchCfg } from '../core/types'
import { useT } from '../i18n'
import { ProfileAvatar } from '../ui/Character'
import { Icon } from '../ui/icons'
import { Feedback, Hud, Prompt, useTimeouts } from '../ui/kit'
import { Matty, type MattyPose } from '../ui/Matty'
import { Sprite, Terrain } from '../ui/scene'
import { useRun, type GameProps } from './run'

type Phase = 'play' | 'pour' | 'launch' | 'spill'
interface Bubble {
  id: number
  /** How much it holds, in units. */
  v: number
  popped?: boolean
}

/**
 * The first game of the journey. Bubbles of stars float by; popping one pours it into the rocket's
 * tank. Fill it exactly to the mark and the rocket takes off; one star too many and it spills.
 * A rocket counts as right when it left without a spill.
 */
export function LaunchGame({ cfg, profile, hints, firstTime, scene = 'beach', onFinish, onExit }: GameProps<LaunchCfg>) {
  const { t, lang } = useT()
  const run = useRun(cfg.rounds, onFinish)
  const later = useTimeouts()
  const ids = useRef(0)
  const float = (sizes: number[]): Bubble[] => sizes.map((v) => ({ id: ids.current++, v }))
  const [target, setTarget] = useState(() => launchTarget(cfg, 0))
  const [bubbles, setBubbles] = useState<Bubble[]>(() => float(launchBubbles(cfg, target)))
  const [level, setLevel] = useState(0)
  const [phase, setPhase] = useState<Phase>('play')
  // Spills on this rocket: after the first Matty says how much is missing, after the second he shows what fits.
  const [spills, setSpills] = useState(0)
  const [cheer, setCheer] = useState(0)

  const done = run.results.length
  const gap = target - level
  const show = (units: number) => fmtNum(units * cfg.unit, lang)
  const help = hints || spills > 0

  const pop = (b: Bubble) => {
    if (phase !== 'play' || b.popped) return
    const next = level + b.v
    setBubbles((bs) => bs.map((x) => (x.id === b.id ? { ...x, popped: true } : x)))
    setLevel(next)
    if (next === target) {
      sfx('win')
      setPhase('launch')
      setCheer((cheer + 1 + Math.floor(Math.random() * 3)) % 4)
      const over = run.record(spills === 0)
      later(() => {
        if (over) return run.finish()
        // Not the same tank twice in a row, when the range allows it.
        let tank = launchTarget(cfg, done + 1)
        for (let tries = 0; tank === target && tries < 4; tries++) tank = launchTarget(cfg, done + 1)
        setTarget(tank)
        setLevel(0)
        setSpills(0)
        setBubbles(float(launchBubbles(cfg, tank)))
        setPhase('play')
      }, 1900)
    } else if (next > target) {
      sfx('bad')
      setPhase('spill')
      setSpills(spills + 1)
      later(() => {
        setLevel(0)
        setBubbles(float(launchBubbles(cfg, target)))
        setPhase('play')
      }, 1700)
    } else {
      sfx('coin')
      setPhase('pour')
      later(() => {
        const others = bubbles.filter((x) => x.id !== b.id).map((x) => x.v)
        const fresh: Bubble = { id: ids.current++, v: launchRefill(cfg, others, target - next) }
        setBubbles((bs) => bs.map((x) => (x.id === b.id ? fresh : x)))
        setPhase('play')
      }, 420)
    }
  }

  const last = phase === 'launch' && done >= cfg.rounds
  const say =
    phase === 'launch'
      ? last
        ? t('launch.say.done')
        : t(`launch.say.go${(cheer % 4) as 0 | 1 | 2 | 3}`)
      : phase === 'spill'
        ? t('launch.say.spill')
        : help && level > 0
          ? t('launch.say.gap', { n: show(gap) })
          : level > 0
            ? t('launch.say.more')
            : done === 0 && spills === 0
              ? t('launch.say.start', { name: profile.name })
              : spills > 0
                ? t('launch.say.again')
                : t('launch.say.next')
  const pose: MattyPose = phase === 'launch' ? 'cheer' : phase === 'spill' ? 'oops' : phase === 'pour' ? 'wow' : level > 0 ? 'think' : 'point'
  // The very first time, one bubble that fits is pointed at.
  const nudged = firstTime && done === 0 && level === 0 && spills === 0 && phase === 'play' ? bubbles.find((b) => b.v <= gap)?.id : undefined

  return (
    <div className="game game-launch">
      <Hud onExit={onExit} results={run.results} total={cfg.rounds} pad={false}>
        <span className="chip" aria-label={t('launch.count', { n: run.results.filter(Boolean).length })}>
          <Icon name="rocket" size={18} /> {done}
        </span>
      </Hud>
      <Prompt text={t('launch.prompt')} />

      <div className={`launch-stage phase-${phase}`}>
        <Terrain scene={scene} height={420} view />
        <div className="launch-buddy">
          <Matty pose={pose} size={62} bounce={phase === 'launch'} />
          <span className="matty-bubble" key={`${phase}${done}${level}`}>
            {say}
          </span>
        </div>

        <div className="launch-sky">
          {bubbles.map((b, i) => (
            <button
              key={b.id}
              className={`star-bubble hue-${i % 5}${b.popped ? ' popped' : ''}${spills >= 2 && b.v > gap && phase === 'play' ? ' too' : ''}${b.id === nudged ? ' nudge' : ''}`}
              style={{ '--i': i } as CSSProperties}
              onClick={() => pop(b)}
              disabled={phase !== 'play' || b.popped}
              aria-label={t('launch.bubble', { n: show(b.v) })}
            >
              {cfg.pips ? (
                <span className={`bubble-pips n${b.v}`}>
                  {Array.from({ length: b.v }, (_, k) => (
                    <Icon key={k} name="star" size={22} />
                  ))}
                </span>
              ) : (
                <span className="bubble-num">
                  {show(b.v)}
                  <Icon name="star" size={16} />
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="launch-pad">
          <div className={`launch-me${phase === 'launch' ? ' hop' : ''}`}>
            <ProfileAvatar p={profile} size={54} />
          </div>
          <div className={`launch-rocket${phase === 'launch' ? ' go' : ''}${phase === 'spill' ? ' cough' : ''}`} key={`r${done - (phase === 'launch' ? 1 : 0)}`}>
            <Sprite name="rocket" size={128} />
          </div>
          <i className="tank-hose" />
          <div
            className={`tank${cfg.pips ? ' cells' : ''}${phase === 'spill' ? ' spill' : ''}${phase === 'launch' ? ' full' : ''}`}
            style={{ '--cells': target } as CSSProperties}
            role="meter"
            aria-valuemin={0}
            aria-valuemax={target * cfg.unit}
            aria-valuenow={level * cfg.unit}
            aria-label={t('launch.tank')}
          >
            <span className="tank-mark">
              <Icon name="star" size={16} /> {show(target)}
            </span>
            <span className="tank-glass">
              <i className="tank-fill" style={{ height: `${Math.min(1, level / target) * 100}%` }} />
              {level > 0 ? (
                <b className="tank-level" key={level} style={{ bottom: `${Math.min(0.8, level / target) * 100}%` }}>
                  {show(level)}
                </b>
              ) : null}
            </span>
          </div>
        </div>
      </div>

      <div className="status-line">
        {phase === 'launch' ? <Feedback kind="good">{t('launch.say.go0')}</Feedback> : null}
        {phase === 'spill' ? <Feedback kind="bad">{t('launch.say.spill')}</Feedback> : null}
      </div>
    </div>
  )
}
