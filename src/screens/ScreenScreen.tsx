import { useEffect, useState } from 'react'
import { sfx } from '../core/audio'
import { back, go } from '../core/nav'
import { finishScreening, pendingScreening, SCREENING_REWARD, useProfile } from '../core/store'
import { ScreenGame } from '../games/ScreenGame'
import { useT } from '../i18n'
import { Confetti, SayButton } from '../ui/kit'
import { Matty } from '../ui/Matty'

/**
 * The Explorer Mission from the child's side: a short story, five stations and a thank-you.
 * No score is ever shown to the child; the measurements go to the teacher's report.
 */
export function ScreenScreen() {
  const { t } = useT()
  const profile = useProfile()
  // Fixed on arrival: finishing the mission makes it no longer "pending".
  const [mission] = useState(() => pendingScreening(profile))
  const [phase, setPhase] = useState<'intro' | 'game' | 'done'>('intro')

  useEffect(() => {
    if (!mission) go({ id: 'class' }, { replace: true })
  }, [mission])
  if (!mission) return null

  if (phase === 'game')
    return (
      <div className="screen world-dojo">
        <ScreenGame
          profile={profile}
          onExit={back}
          onFinish={(tasks, ms) => {
            finishScreening(mission.id, tasks, ms)
            sfx('win')
            setPhase('done')
          }}
        />
      </div>
    )

  if (phase === 'done')
    return (
      <div className="screen world-dojo center">
        <Confetti />
        <div className="card result-card">
          <Matty pose="cheer" size={116} bounce />
          <h1>{t('screen.done')}</h1>
          <p>{t('screen.doneText')}</p>
          <div className="result-loot">
            <span>🪙 +{SCREENING_REWARD}</span>
          </div>
          <button className="btn btn-primary btn-big" onClick={() => go({ id: 'hub' }, { reset: true })}>
            🗺️ {t('res.map')}
          </button>
        </div>
      </div>
    )

  return (
    <div className="screen world-dojo center">
      <div className="card intro-card">
        <button className="icon-btn intro-close" onClick={back} aria-label={t('back')}>
          ←
        </button>
        <Matty pose="hi" size={116} />
        <h1>🚀 {t('screen.title')}</h1>
        <p>
          {t('screen.intro')} <SayButton text={t('screen.intro')} />
        </p>
        <button
          className="btn btn-primary btn-big"
          onClick={() => {
            sfx('tap')
            setPhase('game')
          }}
        >
          ▶ {t('screen.go')}
        </button>
      </div>
    </div>
  )
}
