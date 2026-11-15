import { useEffect, useState } from 'react'
import { sfx } from '../core/audio'
import { getBackend, normalizeCode } from '../core/backend'
import { back, go } from '../core/nav'
import { activeHomework, homeworkStars, joinClass, leaveClass, pendingScreening, refreshClass, useProfile } from '../core/store'
import { useT } from '../i18n'
import { Modal, Stars, TopBar } from '../ui/kit'

/**
 * The child's side of a class: the homework of the week and what the whole class has earned
 * together. There are no rankings and no list of classmates.
 */
export function ClassScreen() {
  const { t } = useT()
  const p = useProfile()
  const [mode, setMode] = useState<'local' | 'cloud'>('cloud')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(p.classCode ? 'loading' : 'ready')
  const [confirmLeave, setConfirmLeave] = useState(false)

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        setMode((await getBackend()).mode)
        if (p.classCode) await refreshClass()
        if (alive) setStatus('ready')
      } catch {
        // Offline: show what we knew last time.
        if (alive) setStatus(p.classInfo ? 'ready' : 'error')
      }
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.classCode])

  const info = p.classInfo
  const hw = activeHomework(p)
  const mission = pendingScreening(p)
  const stars = hw ? Math.min(homeworkStars(p, hw), hw.goal) : 0

  return (
    <div className="screen class">
      <TopBar title={`🏫 ${t('nav.class')}`} onBack={back} />
      <div className="class-body">
        {mode === 'local' ? <p className="mode-note local">{t('class.local')}</p> : null}
        {status === 'error' ? <p className="card error">{t('class.error')}</p> : null}
        {status === 'loading' ? <p className="loading">…</p> : null}
        {!p.classCode ? <Join /> : null}

        {status === 'ready' && p.classCode && info ? (
          <>
            <div className="card class-head">
              <div>
                <h2>{info.name}</h2>
                <small>{t('class.yourNumber', { n: p.classNum ?? '' })}</small>
              </div>
              <div className="class-together">
                <small>{t('class.together')}</small>
                <strong>⭐ {info.stars}</strong>
              </div>
            </div>

            {mission ? (
              <div className="card hw-card">
                <small>🚀 {t('screen.banner')}</small>
                <h2>{t('screen.title')}</h2>
                <button
                  className="btn btn-primary btn-big"
                  onClick={() => {
                    sfx('tap')
                    go({ id: 'screen' })
                  }}
                >
                  ▶ {t('screen.play')}
                </button>
              </div>
            ) : null}

            {hw ? (
              <div className="card hw-card">
                <small>📚 {t('class.homework')}</small>
                <h2>{t(`topic.${hw.topic}` as 'topic.n20')}</h2>
                <div className="hw-progress" aria-label={`${stars}/${hw.goal}`}>
                  <Stars n={stars} max={hw.goal} />
                </div>
                <p>{stars >= hw.goal ? `✔ ${t('class.hwDone')}` : t('class.hwProgress', { n: stars, goal: hw.goal })}</p>
                <button
                  className="btn btn-primary btn-big"
                  onClick={() => {
                    sfx('tap')
                    go({ id: 'homework' })
                  }}
                >
                  ▶ {t(stars >= hw.goal ? 'class.hwMore' : 'class.hwPlay')}
                </button>
              </div>
            ) : (
              <div className="card hw-card">
                <small>📚 {t('class.homework')}</small>
                <p>{t('class.noHomework')}</p>
              </div>
            )}

            <button className="btn btn-quiet" onClick={() => setConfirmLeave(true)}>
              {t('class.leave')}
            </button>
          </>
        ) : null}

        {status === 'ready' && p.classCode && !info ? (
          <div className="card">
            <p>{t('class.gone')}</p>
            <button className="btn" onClick={() => void leaveClass()}>
              {t('class.leave')}
            </button>
          </div>
        ) : null}

        {!p.classCode ? <p className="mode-note">{t('class.teacherHint')}</p> : null}
      </div>

      {confirmLeave ? (
        <Modal onClose={() => setConfirmLeave(false)}>
          <h2>{t('class.leaveAsk')}</h2>
          <div className="btn-row">
            <button className="btn" onClick={() => setConfirmLeave(false)}>
              {t('no')}
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                setConfirmLeave(false)
                void leaveClass()
              }}
            >
              {t('class.leave')}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

function Join() {
  const { t } = useT()
  const [code, setCode] = useState('')
  const [num, setNum] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<'notFound' | 'error' | null>(null)
  const number = Number(num)
  const valid = code.length === 6 && Number.isInteger(number) && number >= 1 && number <= 99

  const join = async () => {
    setBusy(true)
    setError(null)
    try {
      if (await joinClass(code, number)) sfx('win')
      else setError('notFound')
    } catch {
      setError('error')
    }
    setBusy(false)
  }

  return (
    <form
      className="card class-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) void join()
      }}
    >
      <h2>🔑 {t('class.join')}</h2>
      <label className="field">
        <span>{t('class.joinHelp')}</span>
        <input className="code-input" value={code} onChange={(e) => setCode(normalizeCode(e.target.value))} placeholder="ABC123" autoCapitalize="characters" autoComplete="off" aria-label={t('class.code')} />
      </label>
      <label className="field">
        <span>{t('class.numHelp')}</span>
        <input
          className="code-input num-input"
          value={num}
          onChange={(e) => setNum(e.target.value.replace(/\D/g, '').slice(0, 2))}
          placeholder="7"
          inputMode="numeric"
          autoComplete="off"
          aria-label={t('class.num')}
        />
      </label>
      <button className="btn btn-primary" disabled={busy || !valid}>
        {t('class.joinBtn')}
      </button>
      {error ? <p className="error">{t(error === 'notFound' ? 'class.notFound' : 'class.error')}</p> : null}
    </form>
  )
}
