import { useEffect, useState, type FormEvent } from 'react'
import {
  accountClaim,
  accountClasses,
  accountCreateClass,
  accountsAvailable,
  currentUser,
  onAccountChange,
  sendReset,
  setPassword,
  signIn,
  signOut,
  signUp,
  type AccountError,
  type AccountUser,
} from '../core/account'
import { getBackend, type MemberReport } from '../core/backend'
import { classKpis, fmtMinutes } from '../core/insights'
import { weekStart } from '../core/scoring'
import { getState, setTeacherClasses, teacherCreateClass, useApp, type TeacherClass } from '../core/store'
import { useT } from '../i18n'
import { Matty } from '../ui/Matty'
import { ClassView } from './TeacherPanel'
import { LangPicker } from './WelcomeScreen'

/**
 * The teachers' own place, at /docente: an account with a password, every class of hers with its
 * figures, and each class's full panel. Without a cloud behind it (a tablet with no internet,
 * development) there is no account and it simply shows the classes kept on this device.
 */
export function TeacherPortal() {
  const { t } = useT()
  const cloud = accountsAvailable()
  // undefined while the saved session is being read.
  const [user, setUser] = useState<AccountUser | null | undefined>(cloud ? undefined : null)
  const [recovery, setRecovery] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const classes = useApp((s) => s.teacher)

  useEffect(() => {
    document.title = `Matty · ${t('portal.title')}`
    if (!cloud) return
    let stop = () => {}
    void currentUser().then(setUser).catch(() => setUser(null))
    void onAccountChange((u, rec) => {
      setUser(u)
      if (rec) setRecovery(true)
    }).then((off) => (stop = off))
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Signed in: the account says which classes are hers. Classes this device already had join it.
  useEffect(() => {
    if (!user) return
    void (async () => {
      let mine = await accountClasses()
      const loose = getState().teacher.filter((c) => !mine.some((m) => m.code === c.code))
      if (loose.length) {
        await Promise.all(loose.map((c) => accountClaim(c.code, c.key).catch(() => {})))
        mine = await accountClasses()
      }
      setTeacherClasses(mine)
    })().catch(() => {})
  }, [user])

  const leave = async () => {
    await signOut().catch(() => {})
    // On a shared computer nothing of hers stays behind.
    setTeacherClasses([])
    setOpen(null)
  }
  const cls = classes.find((c) => c.code === open)

  return (
    <div className="portal">
      <header className="portal-top">
        <a className="portal-brand" href="/docente" onClick={(e) => (e.preventDefault(), setOpen(null))}>
          <Matty pose="happy" size={44} />
          <span>
            Matt<b>y</b> <small>{t('portal.title')}</small>
          </span>
        </a>
        <span className="portal-spacer" />
        <LangPicker />
        {user ? (
          <span className="portal-user">
            <small>{user.email}</small>
            <button className="btn btn-small" onClick={() => void leave()}>
              {t('account.signOut')}
            </button>
          </span>
        ) : null}
        <a className="btn btn-small" href="/">
          🎮 {t('portal.toGame')}
        </a>
      </header>

      <main className="portal-main">
        {user === undefined ? (
          <p className="portal-wait">…</p>
        ) : recovery ? (
          <NewPassword onDone={() => setRecovery(false)} />
        ) : cloud && !user ? (
          <SignIn />
        ) : cls ? (
          <ClassView cls={cls} onBack={() => setOpen(null)} />
        ) : (
          <ClassList classes={classes} signedIn={!!user} onOpen={setOpen} />
        )}
      </main>
    </div>
  )
}

function SignIn() {
  const { t } = useT()
  const [mode, setMode] = useState<'in' | 'up' | 'reset'>('in')
  const [email, setEmail] = useState('')
  const [password, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<AccountError | null>(null)
  const [sent, setSent] = useState<'confirm' | 'reset' | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setSent(null)
    try {
      if (mode === 'in') await signIn(email, password)
      else if (mode === 'up') {
        if ((await signUp(email, password)) === 'confirm') setSent('confirm')
      } else {
        await sendReset(email)
        setSent('reset')
      }
    } catch (err) {
      setError(((err as Error).message as AccountError) || 'other')
    }
    setBusy(false)
  }

  return (
    <div className="portal-sign">
      <div className="portal-pitch">
        <Matty pose="hi" size={120} />
        <h1>{t('portal.pitchTitle')}</h1>
        <ul>
          {(['1', '2', '3', '4'] as const).map((n) => (
            <li key={n}>{t(`portal.pitch${n}`)}</li>
          ))}
        </ul>
      </div>
      <form className="card sign-card" onSubmit={(e) => void submit(e)}>
        <div className="tabs" role="tablist">
          {(['in', 'up'] as const).map((m) => (
            <button type="button" key={m} role="tab" aria-selected={mode === m} className={`tab${mode === m ? ' on' : ''}`} onClick={() => (setMode(m), setError(null), setSent(null))}>
              {t(m === 'in' ? 'account.signIn' : 'account.signUp')}
            </button>
          ))}
        </div>
        <label className="field">
          <span>{t('account.email')}</span>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@colegio.es" />
        </label>
        {mode === 'reset' ? null : (
          <label className="field">
            <span>{t('account.password')}</span>
            <input type="password" required minLength={8} autoComplete={mode === 'up' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPass(e.target.value)} />
            {mode === 'up' ? <small>{t('account.passwordHelp')}</small> : null}
          </label>
        )}
        {error ? <p className="error">{t(`account.err.${error}`)}</p> : null}
        {sent ? <p className="done-today">{t(sent === 'confirm' ? 'account.confirmSent' : 'account.resetSent')}</p> : null}
        <button className="btn btn-primary btn-big" disabled={busy}>
          {t(mode === 'in' ? 'account.signIn' : mode === 'up' ? 'account.create' : 'account.sendReset')}
        </button>
        {mode === 'reset' ? (
          <button type="button" className="btn btn-quiet" onClick={() => setMode('in')}>
            {t('back')}
          </button>
        ) : (
          <button type="button" className="btn btn-quiet" onClick={() => (setMode('reset'), setError(null), setSent(null))}>
            {t('account.forgot')}
          </button>
        )}
        <small className="sign-privacy">🔐 {t('account.privacy')}</small>
      </form>
    </div>
  )
}

/** After following the link of a password-reset e-mail. */
function NewPassword({ onDone }: { onDone: () => void }) {
  const { t } = useT()
  const [password, setPass] = useState('')
  const [error, setError] = useState<AccountError | null>(null)
  return (
    <form
      className="card sign-card"
      onSubmit={(e) => {
        e.preventDefault()
        setPassword(password).then(onDone, (err) => setError(((err as Error).message as AccountError) || 'other'))
      }}
    >
      <h2>{t('account.newPassword')}</h2>
      <label className="field">
        <span>{t('account.password')}</span>
        <input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPass(e.target.value)} />
        <small>{t('account.passwordHelp')}</small>
      </label>
      {error ? <p className="error">{t(`account.err.${error}`)}</p> : null}
      <button className="btn btn-primary btn-big">{t('teacher.save')}</button>
    </form>
  )
}

function ClassList({ classes, signedIn, onOpen }: { classes: TeacherClass[]; signedIn: boolean; onOpen: (code: string) => void }) {
  const { t } = useT()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setFailed(false)
    try {
      if (signedIn) {
        const made = await accountCreateClass(name.trim())
        setTeacherClasses([...getState().teacher, { code: made.code, key: made.teacherKey, name: name.trim() }])
        onOpen(made.code)
      } else onOpen((await teacherCreateClass(name)).code)
      setName('')
    } catch {
      setFailed(true)
    }
    setBusy(false)
  }

  return (
    <div className="portal-classes">
      <div className="portal-head">
        <h1>🏫 {t('portal.classes')}</h1>
        {signedIn ? null : <p className="portal-local">{t('portal.local')}</p>}
      </div>
      <div className="class-cards">
        {classes.map((c) => (
          <ClassCard key={c.code} cls={c} onOpen={() => onOpen(c.code)} />
        ))}
        <form className="card class-card new" onSubmit={(e) => void create(e)}>
          <h2>➕ {t('class.create')}</h2>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder={t('class.namePh')} aria-label={t('class.name')} />
          <button className="btn btn-primary" disabled={busy || !name.trim()}>
            {t('class.createBtn')}
          </button>
          {failed ? <p className="error">{t('class.error')}</p> : null}
        </form>
      </div>
      {classes.length === 0 ? <p className="portal-empty">{t('portal.empty')}</p> : null}
    </div>
  )
}

/** One class on the list, with this week's figures fetched in the background. */
function ClassCard({ cls, onOpen }: { cls: TeacherClass; onOpen: () => void }) {
  const { t } = useT()
  const [members, setMembers] = useState<MemberReport[] | null>(null)
  useEffect(() => {
    let live = true
    void getBackend()
      .then((b) => b.report(cls.code, cls.key))
      .then((r) => live && setMembers(r))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [cls.code, cls.key])
  const k = members ? classKpis(members, weekStart()) : null
  return (
    <button className="card class-card" onClick={onOpen}>
      <span className="class-card-top">
        <strong>{cls.name}</strong>
        <code>{cls.code}</code>
      </span>
      <span className="class-card-kpis">
        <span>
          <b>{k ? k.pupils : '…'}</b>
          <small>{t('kpi.pupils')}</small>
        </span>
        <span>
          <b>{k ? `${k.active}/${k.pupils}` : '…'}</b>
          <small>{t('kpi.active')}</small>
        </span>
        <span>
          <b>{k ? fmtMinutes(k.minutes) : '…'}</b>
          <small>{t('kpi.minutes')}</small>
        </span>
        <span>
          <b>{k ? (k.accuracy === null ? '—' : `${k.accuracy} %`) : '…'}</b>
          <small>{t('kpi.accuracy')}</small>
        </span>
      </span>
      <span className="class-card-open">{t('portal.open')} ➜</span>
    </button>
  )
}
