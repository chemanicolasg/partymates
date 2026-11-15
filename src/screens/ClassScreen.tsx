import { useCallback, useEffect, useState } from 'react'
import { sfx } from '../core/audio'
import { getBackend, normalizeCode, type ClassRoom, type Member } from '../core/backend'
import { back } from '../core/nav'
import { weekStart } from '../core/scoring'
import { joinClass, leaveClass, setTeam, syncClass, useProfile } from '../core/store'
import { useT } from '../i18n'
import { Avatar, Modal, TopBar } from '../ui/kit'

const TEAM_EMOJI = ['🦈', '🐯', '🦅', '🐺', '🐉', '🦊', '🚀', '⚡', '🔥', '🌟', '🍀', '🎯']
const MEDALS = ['🥇', '🥈', '🥉']

export function ClassScreen() {
  const { t } = useT()
  const p = useProfile()
  const [room, setRoom] = useState<ClassRoom | null>(null)
  const [mode, setMode] = useState<'local' | 'cloud'>('local')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const refresh = useCallback(async () => {
    try {
      const backend = await getBackend()
      setMode(backend.mode)
      if (!p.classCode) {
        setRoom(null)
      } else {
        await syncClass()
        setRoom(await backend.getClass(p.classCode))
      }
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [p.classCode])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <div className="screen class">
      <TopBar title={`🏫 ${t('nav.class')}`} onBack={back}>
        {p.classCode ? (
          <button className="icon-btn" onClick={() => void refresh()} aria-label={t('class.refresh')}>
            ↻
          </button>
        ) : null}
      </TopBar>
      <div className="class-body">
        <p className={`mode-note ${mode}`}>{t(mode === 'cloud' ? 'class.cloud' : 'class.local')}</p>
        {status === 'error' ? <p className="card error">{t('class.error')}</p> : null}
        {status === 'loading' ? <p className="loading">…</p> : null}
        {status !== 'loading' && !p.classCode ? <JoinOrCreate /> : null}
        {status === 'ready' && p.classCode && room ? <Room room={room} meId={p.id} teamId={p.teamId} onChange={refresh} /> : null}
        {status === 'ready' && p.classCode && !room ? (
          <div className="card">
            <p>{t('class.gone')}</p>
            <button className="btn" onClick={() => void leaveClass()}>
              {t('class.leave')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function JoinOrCreate() {
  const { t } = useT()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<'notFound' | 'error' | null>(null)

  const join = async (c: string) => {
    setBusy(true)
    setError(null)
    try {
      if (await joinClass(c)) sfx('win')
      else setError('notFound')
    } catch {
      setError('error')
    }
    setBusy(false)
  }
  const create = async () => {
    setBusy(true)
    setError(null)
    try {
      const backend = await getBackend()
      await join(await backend.createClass(name.trim()))
    } catch {
      setError('error')
      setBusy(false)
    }
  }

  return (
    <>
      <form
        className="card class-form"
        onSubmit={(e) => {
          e.preventDefault()
          void join(code)
        }}
      >
        <h2>🔑 {t('class.join')}</h2>
        <p>{t('class.joinHelp')}</p>
        <input
          className="code-input"
          value={code}
          onChange={(e) => setCode(normalizeCode(e.target.value))}
          placeholder="ABC123"
          autoCapitalize="characters"
          autoComplete="off"
          aria-label={t('class.code')}
        />
        <button className="btn btn-primary" disabled={busy || code.length !== 6}>
          {t('class.joinBtn')}
        </button>
        {error ? <p className="error">{t(error === 'notFound' ? 'class.notFound' : 'class.error')}</p> : null}
      </form>
      <form
        className="card class-form"
        onSubmit={(e) => {
          e.preventDefault()
          void create()
        }}
      >
        <h2>🧑‍🏫 {t('class.create')}</h2>
        <p>{t('class.createHelp')}</p>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder={t('class.namePh')} aria-label={t('class.name')} />
        <button className="btn" disabled={busy || !name.trim()}>
          {t('class.createBtn')}
        </button>
      </form>
    </>
  )
}

function Room({ room, meId, teamId, onChange }: { room: ClassRoom; meId: string; teamId: string | null; onChange: () => Promise<void> }) {
  const { t } = useT()
  const [tab, setTab] = useState<'week' | 'stars' | 'teams'>('week')
  const [newTeam, setNewTeam] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const week = weekStart()
  // A classmate who has not played this week has no weekly points yet.
  const weekly = (m: Member) => (m.week === week ? m.weekXp : 0)
  const score = (m: Member) => (tab === 'stars' ? m.stars : weekly(m))
  const ranked = [...room.members].sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name))
  const teams = room.teams
    .map((team) => {
      const members = room.members.filter((m) => m.teamId === team.id)
      return { ...team, members, points: members.reduce((s, m) => s + weekly(m), 0) }
    })
    .sort((a, b) => b.points - a.points)

  const pick = async (id: string | null) => {
    sfx('tap')
    await setTeam(id)
    await onChange()
  }

  return (
    <>
      <div className="card class-head">
        <div>
          <h2>{room.name}</h2>
          <small>{t('class.members', { n: room.members.length })}</small>
        </div>
        <div className="class-code" aria-label={t('class.code')}>
          <small>{t('class.code')}</small>
          <strong>{room.code}</strong>
        </div>
      </div>
      <div className="tabs" role="tablist">
        {(['week', 'stars', 'teams'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={k === tab} className={`tab${k === tab ? ' on' : ''}`} onClick={() => setTab(k)}>
            {t(`class.tab.${k}`)}
          </button>
        ))}
      </div>

      {tab !== 'teams' ? (
        <ol className="ranking">
          {ranked.map((m, i) => (
            <li key={m.id} className={`rank-row card${m.id === meId ? ' me' : ''}`}>
              <span className="rank-pos">{MEDALS[i] ?? i + 1}</span>
              <Avatar skin={m.skin} color={m.color} pet={m.pet} size={42} />
              <strong>{m.name}</strong>
              <span className="rank-team">{room.teams.find((x) => x.id === m.teamId)?.emoji}</span>
              <span className="rank-score">
                {tab === 'stars' ? '⭐' : '⚡'} {score(m)}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <>
          {teams.length === 0 ? <p className="card">{t('class.noTeams')}</p> : null}
          <ol className="ranking">
            {teams.map((team, i) => (
              <li key={team.id} className={`team-row card${team.id === teamId ? ' me' : ''}`}>
                <div className="team-head">
                  <span className="rank-pos">{MEDALS[i] ?? i + 1}</span>
                  <span className="team-emoji">{team.emoji}</span>
                  <strong>{team.name}</strong>
                  <span className="rank-score">⚡ {team.points}</span>
                </div>
                <div className="team-members">
                  {team.members.map((m) => (
                    <Avatar key={m.id} skin={m.skin} color={m.color} size={30} />
                  ))}
                  {team.id === teamId ? (
                    <button className="btn btn-small" onClick={() => void pick(null)}>
                      {t('class.leaveTeam')}
                    </button>
                  ) : (
                    <button className="btn btn-small btn-primary" onClick={() => void pick(team.id)}>
                      {t('class.joinTeam')}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <button className="btn" onClick={() => setNewTeam(true)}>
            ➕ {t('class.newTeam')}
          </button>
        </>
      )}

      <button className="btn btn-quiet" onClick={() => setConfirmLeave(true)}>
        {t('class.leave')}
      </button>

      {newTeam ? <NewTeam code={room.code} onDone={() => setNewTeam(false)} onCreated={pick} /> : null}
      {confirmLeave ? (
        <Modal onClose={() => setConfirmLeave(false)}>
          <h2>{t('class.leaveAsk')}</h2>
          <div className="btn-row">
            <button className="btn" onClick={() => setConfirmLeave(false)}>
              {t('no')}
            </button>
            <button className="btn btn-danger" onClick={() => void leaveClass()}>
              {t('class.leave')}
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  )
}

function NewTeam({ code, onDone, onCreated }: { code: string; onDone: () => void; onCreated: (id: string) => Promise<void> }) {
  const { t } = useT()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(TEAM_EMOJI[0])
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const create = async () => {
    setBusy(true)
    try {
      const backend = await getBackend()
      const team = await backend.createTeam(code, name.trim(), emoji)
      await onCreated(team.id)
      onDone()
    } catch {
      setFailed(true)
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onDone}>
      <form
        className="class-form"
        onSubmit={(e) => {
          e.preventDefault()
          void create()
        }}
      >
        <h2>{t('class.newTeam')}</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder={t('class.teamPh')} aria-label={t('class.teamName')} autoFocus />
        <div className="pick-row">
          {TEAM_EMOJI.map((e) => (
            <button type="button" key={e} className={`pick${e === emoji ? ' on' : ''}`} onClick={() => setEmoji(e)} aria-pressed={e === emoji}>
              {e}
            </button>
          ))}
        </div>
        {failed ? <p className="error">{t('class.error')}</p> : null}
        <button className="btn btn-primary" disabled={busy || !name.trim()}>
          {t('class.createTeam')}
        </button>
      </form>
    </Modal>
  )
}
