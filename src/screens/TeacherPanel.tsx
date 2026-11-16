import { useCallback, useEffect, useState } from 'react'
import { getBackend, normalizeCode, type ClassInfo, type Homework, type MemberReport } from '../core/backend'
import { fmtNum } from '../core/format'
import { MIN_GROUP, readClass, TASKS, type Level, type ScreenResult } from '../core/screening'
import { KINDS } from '../core/types'
import { factLabel } from '../core/format'
import { decodeLook } from '../core/look'
import { dayKey, weekStart } from '../core/scoring'
import { teacherCreateClass, teacherDeleteClass, teacherForgetClass, teacherNameStudent, teacherOpenClass, teacherSetWorld, useApp, type TeacherClass } from '../core/store'
import { AREAS, TOPICS, type Topic } from '../core/topics'
import { cleanWorld } from '../core/worlds'
import { useT } from '../i18n'
import { Character } from '../ui/Character'
import { Modal } from '../ui/kit'
import { KIND_ICON, TASK_ICON } from './art'
import { WorldSection } from './WorldEditor'

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

      <WorldSection
        world={cleanWorld(info?.world)}
        members={members ?? []}
        names={cls.names}
        onSet={async (world) => {
          await teacherSetWorld(cls.code, world)
          await load()
        }}
      />

      {members?.length ? <ClassSummary members={members} week={week} /> : null}

      <ScreeningSection
        members={members ?? []}
        active={info?.screening && info.screening.until >= dayKey() ? info.screening : null}
        names={cls.names}
        until={until}
        onSet={async (screening) => {
          const backend = await getBackend()
          await backend.setScreening(cls.code, cls.key, screening)
          await load()
        }}
      />

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
                {totals.total ? (
                  <>
                    <p>{t('teacher.kinds')}</p>
                    <div className="kind-bars">
                      {KINDS.filter((k) => m.stats.byKind[k]?.total).map((k) => {
                        const pct = Math.round((m.stats.byKind[k].ok / m.stats.byKind[k].total) * 100)
                        return (
                          <span key={k} title={t(`mission.${k}`)}>
                            {KIND_ICON[k]}
                            <span className="meter">
                              <i style={{ width: `${pct}%` }} />
                            </span>
                            {pct} %
                          </span>
                        )
                      })}
                    </div>
                  </>
                ) : null}
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

const LEVEL_CLASS: Record<Level, string> = { ok: 'ok', watch: 'watch', low: 'low' }

/**
 * Number-sense mission for the teacher: switch it on for the class and read the results.
 * Colours only compare a pupil with this group, and say so; nothing here is a diagnosis.
 */
function ScreeningSection({
  members,
  active,
  names,
  until,
  onSet,
}: {
  members: MemberReport[]
  active: { id: string; until: string } | null
  names: Record<string, string>
  until: (day: string) => string
  onSet: (screening: { id: string; until: string } | null) => Promise<void>
}) {
  const { t, lang } = useT()
  const [busy, setBusy] = useState(false)
  const done = members.filter((m) => m.stats?.screen)
  const results: Record<string, ScreenResult> = Object.fromEntries(done.map((m) => [m.id, m.stats.screen as ScreenResult]))
  const reading = readClass(results)
  const run = async (screening: { id: string; until: string } | null) => {
    setBusy(true)
    await onSet(screening).catch(() => {})
    setBusy(false)
  }

  return (
    <section className="card">
      <h2>🔭 {t('teacher.screen.title')}</h2>
      <p>{t('teacher.screen.about')}</p>
      <p className="screen-warn">⚠️ {t('teacher.screen.warn')}</p>
      <p className="hw-current">{active ? t('teacher.screen.on', { day: until(active.until) }) : t('teacher.screen.off')}</p>
      <div className="btn-row">
        <button className="btn btn-primary" disabled={busy} onClick={() => void run({ id: crypto.randomUUID(), until: sunday(1) })}>
          {t(active || done.length ? 'teacher.screen.restart' : 'teacher.screen.start')}
        </button>
        {active ? (
          <button className="btn" disabled={busy} onClick={() => void run(null)}>
            {t('teacher.screen.stop')}
          </button>
        ) : null}
      </div>

      {done.length ? (
        <>
          <p>{t('teacher.screen.count', { n: done.length, total: members.length })}</p>
          <p className="screen-legend">{reading ? t('teacher.screen.legend') : t('teacher.screen.small', { n: MIN_GROUP })}</p>
          {done.map((m) => {
            const r = results[m.id]
            const read = reading?.[m.id]
            return (
              <details key={m.id} className="student">
                <summary>
                  <span className="student-num">{m.num}</span>
                  <span className="student-name">
                    <strong>{names[m.num] || m.name}</strong>
                    {read?.observe ? <small className="observe">👀 {t('teacher.screen.observe')}</small> : null}
                  </span>
                  <span className="task-dots">
                    {TASKS.map((k) => (
                      <i key={k} className={read ? LEVEL_CLASS[read.tasks[k] ?? 'ok'] : 'none'} title={t(`screen.${k}.title`)}>
                        {TASK_ICON[k]}
                      </i>
                    ))}
                  </span>
                </summary>
                <table className="task-table">
                  <tbody>
                    {TASKS.map((k) => {
                      const s = r.tasks[k]
                      return (
                        <tr key={k} className={read ? LEVEL_CLASS[read.tasks[k] ?? 'ok'] : ''}>
                          <th>
                            {TASK_ICON[k]} {t(`screen.${k}.title`)}
                          </th>
                          <td>
                            {s.ok}/{s.n} {t('teacher.screen.right')}
                          </td>
                          <td>{k === 'line' ? `${fmtNum(s.pae ?? 0, lang)} % ${t('teacher.screen.error')}` : `${fmtNum(Math.round(s.ms / 100) / 10, lang)} s`}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <p>
                  {new Date(`${r.day}T12:00:00`).toLocaleDateString(lang)} · {t(`band.${r.band}`)}
                </p>
              </details>
            )
          })}
        </>
      ) : null}
    </section>
  )
}

/** The class as a whole: how much it played this week, where it is strong and what most pupils find hard. */
function ClassSummary({ members, week }: { members: MemberReport[]; week: string }) {
  const { t, lang } = useT()
  const active = members.filter((m) => m.stats?.week === week && m.stats.weekMin > 0)
  const minutes = active.reduce((s, m) => s + m.stats.weekMin, 0)
  const kinds = KINDS.map((k) => {
    const sum = members.reduce((acc, m) => ({ ok: acc.ok + (m.stats?.byKind?.[k]?.ok ?? 0), total: acc.total + (m.stats?.byKind?.[k]?.total ?? 0) }), { ok: 0, total: 0 })
    return { k, pct: sum.total ? Math.round((sum.ok / sum.total) * 100) : null }
  }).filter((x) => x.pct !== null)
  // Facts that several pupils keep getting wrong are worth a few minutes on the board.
  const counts = new Map<string, number>()
  for (const m of members) for (const key of m.stats?.weak ?? []) counts.set(key, (counts.get(key) ?? 0) + 1)
  const hard = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)

  return (
    <section className="card">
      <h2>📊 {t('teacher.summary')}</h2>
      <p>{t('teacher.summaryWeek', { n: active.length, total: members.length, min: active.length ? Math.round(minutes / active.length) : 0 })}</p>
      {kinds.length ? (
        <>
          <p>{t('teacher.kinds')}</p>
          <div className="kind-bars">
            {kinds.map(({ k, pct }) => (
              <span key={k} title={t(`mission.${k}`)}>
                {KIND_ICON[k]}
                <span className="meter">
                  <i style={{ width: `${pct}%` }} />
                </span>
                {pct} %
              </span>
            ))}
          </div>
        </>
      ) : null}
      {hard.length ? (
        <>
          <p>{t('teacher.hard')}</p>
          <div className="weak-facts">
            {hard.map(([key, n]) => (
              <span key={key}>
                {factLabel(key, lang)} <b>· {n}</b>
              </span>
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}
