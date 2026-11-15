import { useCallback, useEffect, useState } from 'react'
import { getBackend, normalizeCode, type ClassInfo, type Homework, type MemberReport } from '../core/backend'
import { factLabel } from '../core/format'
import { decodeLook } from '../core/look'
import { dayKey, weekStart } from '../core/scoring'
import { teacherCreateClass, teacherDeleteClass, teacherForgetClass, teacherNameStudent, teacherOpenClass, useApp, type TeacherClass } from '../core/store'
import { AREAS, TOPICS, type Topic } from '../core/topics'
import { useT } from '../i18n'
import { Character } from '../ui/Character'
import { Modal } from '../ui/kit'

/** Sunday of this week (or a later one) as a day key: homework runs until then. */
function sunday(weeksAhead: number): string {
  const d = new Date(`${weekStart()}T12:00:00`)
  d.setDate(d.getDate() + 6 + 7 * weeksAhead)
  return dayKey(d.getTime())
}

/** Teacher area: classes kept on this device, each with its homework and a report per child. */
export function TeacherPanel() {
  const { t } = useT()
  const classes = useApp((s) => s.teacher)
  const [openCode, setOpenCode] = useState<string | null>(classes.length === 1 ? classes[0].code : null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cls = classes.find((c) => c.code === openCode)

  if (cls) return <ClassView cls={cls} onBack={() => setOpenCode(null)} />

  const run = async (fn: () => Promise<string | null>) => {
    setBusy(true)
    setError(null)
    try {
      const opened = await fn()
      if (opened) setOpenCode(opened)
      else setError(t('teacher.badKey'))
    } catch {
      setError(t('class.error'))
    }
    setBusy(false)
  }

  return (
    <div className="report">
      <section className="card">
        <h2>🧑‍🏫 {t('teacher.title')}</h2>
        <p>{t('teacher.intro')}</p>
        {classes.map((c) => (
          <button key={c.code} className="btn class-pick" onClick={() => setOpenCode(c.code)}>
            <strong>{c.name}</strong>
            <span>{c.code}</span>
          </button>
        ))}
      </section>

      <form
        className="card class-form"
        onSubmit={(e) => {
          e.preventDefault()
          void run(async () => (await teacherCreateClass(name)).code)
        }}
      >
        <h2>➕ {t('class.create')}</h2>
        <p>{t('class.createHelp')}</p>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder={t('class.namePh')} aria-label={t('class.name')} />
        <button className="btn btn-primary" disabled={busy || !name.trim()}>
          {t('class.createBtn')}
        </button>
      </form>

      <form
        className="card class-form"
        onSubmit={(e) => {
          e.preventDefault()
          void run(async () => ((await teacherOpenClass(code, key)) ? code : null))
        }}
      >
        <h2>🔑 {t('teacher.open')}</h2>
        <p>{t('teacher.openHelp')}</p>
        <input className="code-input" value={code} onChange={(e) => setCode(normalizeCode(e.target.value))} placeholder="ABC123" aria-label={t('class.code')} autoComplete="off" />
        <input className="code-input" value={key} onChange={(e) => setKey(normalizeCode(e.target.value, 8))} placeholder="ABCD2345" aria-label={t('teacher.key')} autoComplete="off" />
        <button className="btn" disabled={busy || code.length !== 6 || key.length !== 8}>
          {t('teacher.openBtn')}
        </button>
        {error ? <p className="error">{error}</p> : null}
      </form>
    </div>
  )
}

function ClassView({ cls, onBack }: { cls: TeacherClass; onBack: () => void }) {
  const { t, lang } = useT()
  const [members, setMembers] = useState<MemberReport[] | null>(null)
  const [info, setInfo] = useState<ClassInfo | null>(null)
  const [failed, setFailed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState<MemberReport | null>(null)
  const [deleting, setDeleting] = useState(false)
  const week = weekStart()

  const load = useCallback(async () => {
    setFailed(false)
    try {
      const backend = await getBackend()
      const [report, klass] = await Promise.all([backend.report(cls.code, cls.key), backend.getClass(cls.code)])
      setMembers([...report].sort((a, b) => a.num - b.num || a.name.localeCompare(b.name)))
      setInfo(klass)
    } catch {
      setFailed(true)
    }
  }, [cls.code, cls.key])

  useEffect(() => {
    void load()
  }, [load])

  const hw = info?.homework && info.homework.until >= dayKey() ? info.homework : null
  const hwStars = (m: MemberReport) => (hw && m.stats?.hw?.id === hw.id ? Math.min(m.stats.hw.stars, hw.goal) : 0)
  const finished = hw && members ? members.filter((m) => hwStars(m) >= hw.goal).length : 0
  const repeated = new Set((members ?? []).filter((m, _, all) => all.filter((x) => x.num === m.num).length > 1).map((m) => m.num))
  const until = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' })

  const saveHomework = async (homework: Homework | null) => {
    const backend = await getBackend()
    await backend.setHomework(cls.code, cls.key, homework)
    setEditing(false)
    await load()
  }

  return (
    <div className="report">
      <section className="card teacher-head">
        <button className="btn btn-small" onClick={onBack}>
          ← {t('teacher.classes')}
        </button>
        <h2>{cls.name}</h2>
        <div className="teacher-codes">
          <div className="class-code">
            <small>{t('teacher.codeKids')}</small>
            <strong>{cls.code}</strong>
          </div>
          <div className="class-code key">
            <small>{t('teacher.key')}</small>
            <strong>{cls.key}</strong>
          </div>
        </div>
        <p>{t('teacher.codesHelp')}</p>
      </section>

      <section className="card">
        <h2>📚 {t('class.homework')}</h2>
        {hw ? (
          <>
            <p className="hw-current">
              <strong>{t(`topic.${hw.topic}` as 'topic.n20')}</strong> · ⭐ {hw.goal} · {t('teacher.until', { day: until(hw.until) })}
            </p>
            <p>{t('teacher.finished', { n: finished, total: members?.length ?? 0 })}</p>
          </>
        ) : (
          <p>{t('teacher.noHomework')}</p>
        )}
        <div className="btn-row">
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            {t(hw ? 'teacher.change' : 'teacher.set')}
          </button>
          {hw ? (
            <button className="btn" onClick={() => void saveHomework(null)}>
              {t('teacher.clear')}
            </button>
          ) : null}
        </div>
      </section>

      <section className="card">
        <div className="teacher-row-head">
          <h2>
            👧 {t('teacher.students')} {members ? `(${members.length})` : ''}
          </h2>
          <button className="icon-btn" onClick={() => void load()} aria-label={t('class.refresh')}>
            ↻
          </button>
        </div>
        {failed ? <p className="error">{t('class.error')}</p> : null}
        {members === null && !failed ? <p>…</p> : null}
        {members?.length === 0 ? <p>{t('teacher.empty', { code: cls.code })}</p> : null}
        {members?.map((m) => {
          const fresh = m.stats?.week === week
          const totals = Object.values(m.stats?.byKind ?? {}).reduce((s, k) => ({ ok: s.ok + k.ok, total: s.total + k.total }), { ok: 0, total: 0 })
          const done = hw ? hwStars(m) >= hw.goal : false
          return (
            <details key={m.id} className="student">
              <summary>
                <span className={`student-num${repeated.has(m.num) ? ' dup' : ''}`}>{m.num}</span>
                <Character look={decodeLook(m.look)} size={40} />
                <span className="student-name">
                  <strong>{cls.names[m.num] || m.name}</strong>
                  <small>
                    ⭐ {m.stars} · ⏱️ {fresh ? m.stats.weekMin : 0} min
                    {totals.total ? ` · 🎯 ${Math.round((totals.ok / totals.total) * 100)} %` : ''}
                  </small>
                </span>
                {hw ? <span className={`student-hw${done ? ' done' : ''}`}>{done ? '✔' : `${hwStars(m)}/${hw.goal}`}</span> : null}
              </summary>
              <div className="student-more">
                <label className="field">
                  <span>{t('teacher.nameLabel')}</span>
                  <input defaultValue={cls.names[m.num] ?? ''} maxLength={30} placeholder={m.name} onBlur={(e) => teacherNameStudent(cls.code, m.num, e.target.value.trim())} />
                </label>
                <p>
                  {t('teacher.nick')}: <b>{m.name}</b> · {t('teacher.lastSeen')}: {new Date(m.updatedAt).toLocaleDateString(lang)}
                </p>
                {repeated.has(m.num) ? <p className="error">⚠ {t('teacher.dupNum')}</p> : null}
                {m.stats?.weak?.length ? (
                  <>
                    <p>{t('gu.weak')}</p>
                    <div className="weak-facts">
                      {m.stats.weak.map((k) => (
                        <span key={k}>{factLabel(k, lang)}</span>
                      ))}
                    </div>
                  </>
                ) : null}
                <button className="btn btn-small btn-danger" onClick={() => setRemoving(m)}>
                  {t('teacher.remove')}
                </button>
              </div>
            </details>
          )
        })}
      </section>

      <button className="btn btn-quiet" onClick={() => (teacherForgetClass(cls.code), onBack())}>
        {t('teacher.forget')}
      </button>
      <button className="btn btn-danger" onClick={() => setDeleting(true)}>
        🗑️ {t('teacher.delete')}
      </button>

      {deleting ? (
        <Modal onClose={() => setDeleting(false)}>
          <h2>{t('teacher.deleteAsk', { name: cls.name })}</h2>
          <p>{t('teacher.deleteHelp')}</p>
          <div className="btn-row">
            <button className="btn" onClick={() => setDeleting(false)}>
              {t('no')}
            </button>
            <button
              className="btn btn-danger"
              onClick={async () => {
                await teacherDeleteClass(cls.code).catch(() => setFailed(true))
                setDeleting(false)
              }}
            >
              {t('teacher.delete')}
            </button>
          </div>
        </Modal>
      ) : null}

      {editing ? <HomeworkEditor current={hw} until={until} onSave={saveHomework} onClose={() => setEditing(false)} /> : null}
      {removing ? (
        <Modal onClose={() => setRemoving(null)}>
          <h2>{t('teacher.removeAsk', { name: cls.names[removing.num] || removing.name })}</h2>
          <div className="btn-row">
            <button className="btn" onClick={() => setRemoving(null)}>
              {t('no')}
            </button>
            <button
              className="btn btn-danger"
              onClick={async () => {
                const backend = await getBackend()
                await backend.removeMember(cls.code, cls.key, removing.id).catch(() => {})
                setRemoving(null)
                await load()
              }}
            >
              {t('teacher.remove')}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

function HomeworkEditor({
  current,
  until,
  onSave,
  onClose,
}: {
  current: Homework | null
  until: (day: string) => string
  onSave: (hw: Homework) => Promise<void>
  onClose: () => void
}) {
  const { t } = useT()
  const first = TOPICS.find((x) => x.id === current?.topic)
  const [area, setArea] = useState<Topic['area']>(first?.area ?? 'sub')
  const [topic, setTopic] = useState<string | null>(current?.topic ?? null)
  const [goal, setGoal] = useState(current?.goal ?? 5)
  // Set on a Friday or at the weekend, homework is meant for the week that follows.
  const [weeks, setWeeks] = useState(() => ([5, 6, 0].includes(new Date().getDay()) ? 1 : 0))
  const [busy, setBusy] = useState(false)

  return (
    <Modal onClose={onClose}>
      <h2>📚 {t('teacher.pick')}</h2>
      <div className="chips">
        {AREAS.map((a) => (
          <button key={a} className={`chip-btn${a === area ? ' on' : ''}`} onClick={() => setArea(a)} aria-pressed={a === area}>
            {t(`area.${a}`)}
          </button>
        ))}
      </div>
      <div className="topic-list">
        {TOPICS.filter((x) => x.area === area).map((x) => (
          <button key={x.id} className={`topic${x.id === topic ? ' on' : ''}`} onClick={() => setTopic(x.id)} aria-pressed={x.id === topic}>
            {t(`topic.${x.id}` as 'topic.n20')}
          </button>
        ))}
      </div>
      <p className="field-label">{t('teacher.goal')}</p>
      <div className="chips">
        {[3, 5, 8, 12].map((g) => (
          <button key={g} className={`chip-btn${g === goal ? ' on' : ''}`} onClick={() => setGoal(g)} aria-pressed={g === goal}>
            ⭐ {g}
          </button>
        ))}
      </div>
      <p className="field-label">{t('teacher.untilLabel')}</p>
      <div className="chips">
        {[0, 1].map((w) => (
          <button key={w} className={`chip-btn${w === weeks ? ' on' : ''}`} onClick={() => setWeeks(w)} aria-pressed={w === weeks}>
            {until(sunday(w))}
          </button>
        ))}
      </div>
      <button
        className="btn btn-primary"
        disabled={!topic || busy}
        onClick={async () => {
          if (!topic) return
          setBusy(true)
          // A new id restarts every child's count, so re-setting the same topic gives a fresh week.
          await onSave({ id: crypto.randomUUID(), topic, goal, until: sunday(weeks) }).catch(() => setBusy(false))
        }}
      >
        {t('teacher.save')}
      </button>
    </Modal>
  )
}
