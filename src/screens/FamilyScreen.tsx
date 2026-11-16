import { useEffect, useState } from 'react'
import { sfx } from '../core/audio'
import { normalizeCode } from '../core/backend'
import { back, go } from '../core/nav'
import { activeHomework, familyWorld, homeworkStars, joinFamily, leaveFamily, refreshClass, useProfile, weekDays, weeklyGoal, worldStars } from '../core/store'
import { useT } from '../i18n'
import { Icon } from '../ui/icons'
import { Stars, TopBar } from '../ui/kit'
import { MattySays } from '../ui/Matty'
import { SceneBadge } from '../ui/scene'

/** What the family has sent to this player: a mission with a few words of their own, a world, a weekly goal. */
export function FamilyScreen() {
  const { t } = useT()
  const p = useProfile()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    void refreshClass().catch(() => {})
  }, [])

  const mission = activeHomework(p, Date.now(), 'family')
  const world = familyWorld(p)
  const goal = weeklyGoal(p)
  const days = weekDays(p)
  const stars = mission ? Math.min(homeworkStars(p, mission, 'family'), mission.goal) : 0

  const join = async () => {
    setBusy(true)
    setError(false)
    const ok = await joinFamily(code).catch(() => false)
    setBusy(false)
    if (ok) sfx('good')
    else setError(true)
  }

  return (
    <div className="screen class-screen family-screen">
      <TopBar title={t('family.title')} onBack={back} />
      <div className="report">
        {!p.family ? (
          <form
            className="card class-form"
            onSubmit={(e) => {
              e.preventDefault()
              void join()
            }}
          >
            <MattySays pose="hi" size={76}>
              {t('family.connectKid')}
            </MattySays>
            <input className="code-input" value={code} onChange={(e) => setCode(normalizeCode(e.target.value))} placeholder="ABC123" aria-label={t('family.code')} autoComplete="off" />
            <button className="btn btn-primary" disabled={busy || code.length !== 6}>
              {t('class.joinBtn')}
            </button>
            {error ? <p className="error">{t('family.badCode')}</p> : null}
          </form>
        ) : (
          <>
            <section className="card family-head">
              <Icon name="heart" size={34} />
              <div>
                <h2>{p.family.info?.name ?? t('family.title')}</h2>
                <small>{t('plan.week', { n: Math.min(days, goal.days), plan: goal.days })}</small>
              </div>
              <span className="plan-dots big" aria-hidden="true">
                {Array.from({ length: goal.days }, (_, i) => (
                  <i key={i} className={i < days ? 'on' : ''} />
                ))}
              </span>
            </section>

            {mission ? (
              <section className="card hw-card family-mission">
                <small>
                  <Icon name="heart" size={16} /> {t('family.mission')}
                </small>
                <h2>{t(`topic.${mission.topic}` as 'topic.n20')}</h2>
                {mission.note ? <p className="family-note">“{mission.note}”</p> : null}
                <Stars n={stars} max={mission.goal} />
                <p>{stars >= mission.goal ? t('family.missionDone') : t('class.hwProgress', { n: stars, goal: mission.goal })}</p>
                {mission.prize ? (
                  <p className={`family-prize${stars >= mission.goal ? ' won' : ''}`}>
                    <Icon name="gift" size={22} /> {mission.prize}
                  </p>
                ) : null}
                <button
                  className="btn btn-primary btn-big"
                  onClick={() => {
                    sfx('tap')
                    go({ id: 'homework', src: 'family' })
                  }}
                >
                  <Icon name="play" size={20} /> {t('family.play')}
                </button>
              </section>
            ) : (
              <section className="card">
                <p>{t('family.noMission')}</p>
              </section>
            )}

            {world ? (
              <section className="card hw-card">
                <small>{t('family.world')}</small>
                <h2>
                  <SceneBadge scene={world.scene} size={30} /> {world.name}
                </h2>
                <p>
                  ⭐ {worldStars(p, world)}/{world.stops.length * 3}
                </p>
                <button
                  className="btn btn-primary btn-big"
                  onClick={() => {
                    sfx('tap')
                    go({ id: 'world', src: 'family' })
                  }}
                >
                  <Icon name="play" size={20} /> {t('family.enter')}
                </button>
              </section>
            ) : null}

            <button className="btn btn-quiet" onClick={() => void leaveFamily()}>
              {t('family.leave')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
