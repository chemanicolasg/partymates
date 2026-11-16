import { useCallback, useEffect, useState } from 'react'
import { getBackend, type ClassInfo, type Goal, type Homework, type MemberReport } from '../core/backend'
import { factLabel } from '../core/format'
import { familyLink, fmtMinutes, PLAN, pupilLine } from '../core/insights'
import { decodeLook } from '../core/look'
import { dayKey, weekStart } from '../core/scoring'
import { teacherDeleteClass, teacherSetGoal, teacherSetWorld, type TeacherClass } from '../core/store'
import { cleanWorld } from '../core/worlds'
import { useT } from '../i18n'
import { Character } from '../ui/Character'
import { Modal } from '../ui/kit'
import { HomeworkEditor } from './TeacherPanel'
import { WorldSection } from './WorldEditor'

const DAYS = [2, 3, 4, 5, 6, 7]
const MINUTES = [10, 15, 20, 30]

/**
 * A family as its parents see it: how to connect the children's game, a plain-words summary of
 * each child's week, and what they can send — a mission with a note, a weekly goal, a world.
 */
export function FamilyView({ cls, onBack }: { cls: TeacherClass; onBack: () => void }) {
  const { t, lang } = useT()
  const [members, setMembers] = useState<MemberReport[] | null>(null)
  const [info, setInfo] = useState<ClassInfo | null>(null)
  const [failed, setFailed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qr, setQr] = useState('')
  const week = weekStart()
  const link = familyLink(window.location.origin, cls.code)

  const load = useCallback(async () => {
    setFailed(false)
    try {
      const backend = await getBackend()
      const [report, group] = await Promise.all([backend.report(cls.code, cls.key), backend.getClass(cls.code)])
      setMembers([...report].sort((a, b) => a.name.localeCompare(b.name)))
      setInfo(group)
    } catch {
      setFailed(true)
    }
  }, [cls.code, cls.key])

  useEffect(() => {
    void load()
    // The QR drawing code is only fetched here, where it is needed.
    void import('qrcode-generator').then(({ default: make }) => {
      const code = make(0, 'M')
      code.addData(link)
      code.make()
      setQr(code.createSvgTag({ scalable: true, margin: 0 }))
    })
  }, [load, link])

  const goal: Goal = info?.goal ?? PLAN
  const mission = info?.homework && info.homework.until >= dayKey() ? info.homework : null
  const until = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' })
  const setGoal = async (next: Goal) => {
    await teacherSetGoal(cls.code, next).catch(() => setFailed(true))
    await load()
  }
  const saveMission = async (hw: Homework | null) => {
    await (await getBackend()).setHomework(cls.code, cls.key, hw)
    setEditing(false)
    await load()
  }

  // One paragraph per child, in words a parent would use; the same text goes to the clipboard.
  const summaries = (members ?? []).map((m) => {
    const l = pupilLine(m, week)
    const stars = mission && m.stats?.hw?.id === mission.id ? Math.min(m.stats.hw.stars, mission.goal) : 0
    const lines = [
      l.active ? t('family.sum.played', { days: l.days, goal: goal.days, min: fmtMinutes(l.weekMin) }) : t('family.sum.idle'),
      l.days >= goal.days ? t('family.sum.goalMet') : l.active ? t('family.sum.goalLeft', { n: goal.days - l.days }) : '',
      l.accuracy !== null ? t('family.sum.accuracy', { pct: l.accuracy }) : '',
      l.strongest ? t('family.sum.strong', { skill: t(`skill.${l.strongest}`) }) : '',
      l.weakest ? t('family.sum.weak', { skill: t(`skill.${l.weakest}`) }) : '',
      mission ? t(stars >= mission.goal ? 'family.sum.missionDone' : 'family.sum.mission', { n: stars, goal: mission.goal }) : '',
    ].filter(Boolean)
    return { m, l, lines, tip: l.weakest ? t(`family.tip.${l.weakest}`) : null }
  })
  const copy = async () => {
    const text = summaries.map((s) => `${s.m.name}\n${s.lines.join(' ')}${s.tip ? `\n${t('family.idea')}: ${s.tip}` : ''}`).join('\n\n')
    await navigator.clipboard?.writeText(`${cls.name} · ${t('family.summary')}\n\n${text}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="report family-view">
      <section className="card teacher-head family-connect">
        <button className="btn btn-small" onClick={onBack}>
          ← {t('back')}
        </button>
        <h2>{cls.name}</h2>
        <div className="family-connect-row">
          {/* Drawn on this device from our own link. */}
          <span className="access-qr" dangerouslySetInnerHTML={{ __html: qr }} />
          <div>
            <h3>{t('family.connectTitle')}</h3>
            <ol>
              <li>{t('family.connect1')}</li>
              <li>{t('family.connect2', { code: cls.code })}</li>
            </ol>
            <div className="class-code">
              <small>{t('family.code')}</small>
              <strong>{cls.code}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="card family-summary">
        <div className="teacher-row-head">
          <h2>{t('family.summary')}</h2>
          <button className="icon-btn" onClick={() => void load()} aria-label={t('class.refresh')}>
            ↻
          </button>
        </div>
        {failed ? <p className="error">{t('class.error')}</p> : null}
        {members?.length === 0 ? <p>{t('family.nobody')}</p> : null}
        {summaries.map(({ m, l, lines, tip }) => (
          <article className="child-card" key={m.id}>
            <Character look={decodeLook(m.look)} size={56} />
            <div>
              <h3>
                {m.name}
                <span className="plan-dots" title={t('table.days', { n: l.days, plan: goal.days })}>
                  {Array.from({ length: goal.days }, (_, i) => (
                    <i key={i} className={i < l.days ? 'on' : ''} />
                  ))}
                </span>
              </h3>
              <p>{lines.join(' ')}</p>
              {m.stats?.weak?.length ? (
                <p className="weak-facts">
                  {m.stats.weak.slice(0, 5).map((key) => (
                    <span key={key}>{factLabel(key, lang)}</span>
                  ))}
                </p>
              ) : null}
              {tip ? (
                <p className="family-idea">
                  <b>{t('family.idea')}:</b> {tip}
                </p>
              ) : null}
              <button
                className="btn btn-quiet"
                onClick={async () => {
                  await (await getBackend()).removeMember(cls.code, cls.key, m.id).catch(() => {})
                  await load()
                }}
              >
                {t('family.disconnect')}
              </button>
            </div>
          </article>
        ))}
        {summaries.length ? (
          <div className="btn-row">
            <button className="btn" onClick={() => void copy()}>
              {copied ? `✔ ${t('family.copied')}` : t('family.copy')}
            </button>
          </div>
        ) : null}
        <small>{t('family.summaryNote')}</small>
      </section>

      <section className="card">
        <h2>{t('family.mission')}</h2>
        <p>{t('family.missionAbout')}</p>
        {mission ? (
          <p className="hw-current">
            <strong>{t(`topic.${mission.topic}` as 'topic.n20')}</strong> · ⭐ {mission.goal} · {t('teacher.until', { day: until(mission.until) })}
            {mission.note ? <em> · “{mission.note}”</em> : null}
            {mission.prize ? <> · 🎁 {mission.prize}</> : null}
          </p>
        ) : (
          <p className="hw-current">{t('family.noMissionParent')}</p>
        )}
        <div className="btn-row">
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            {t(mission ? 'teacher.change' : 'family.send')}
          </button>
          {mission ? (
            <button className="btn" onClick={() => void saveMission(null)}>
              {t('teacher.clear')}
            </button>
          ) : null}
        </div>
      </section>

      <section className="card">
        <h2>{t('family.goal')}</h2>
        <p>{t('family.goalAbout')}</p>
        <p className="field-label">{t('family.goalDays')}</p>
        <div className="chips">
          {DAYS.map((d) => (
            <button key={d} className={`chip-btn${d === goal.days ? ' on' : ''}`} aria-pressed={d === goal.days} onClick={() => void setGoal({ ...goal, days: d })}>
              {d}
            </button>
          ))}
        </div>
        <p className="field-label">{t('family.goalMinutes')}</p>
        <div className="chips">
          {MINUTES.map((m) => (
            <button key={m} className={`chip-btn${m === goal.minutes ? ' on' : ''}`} aria-pressed={m === goal.minutes} onClick={() => void setGoal({ ...goal, minutes: m })}>
              {m} min
            </button>
          ))}
        </div>
      </section>

      <WorldSection
        family
        world={cleanWorld(info?.world)}
        members={members ?? []}
        names={{}}
        onSet={async (world) => {
          await teacherSetWorld(cls.code, world)
          await load()
        }}
      />

      <button className="btn btn-danger" onClick={() => setDeleting(true)}>
        {t('family.delete')}
      </button>

      {editing ? <HomeworkEditor family current={mission} until={until} onSave={saveMission} onClose={() => setEditing(false)} /> : null}
      {deleting ? (
        <Modal onClose={() => setDeleting(false)}>
          <h2>{t('teacher.deleteAsk', { name: cls.name })}</h2>
          <p>{t('family.deleteHelp')}</p>
          <div className="btn-row">
            <button className="btn" onClick={() => setDeleting(false)}>
              {t('no')}
            </button>
            <button
              className="btn btn-danger"
              onClick={async () => {
                await teacherDeleteClass(cls.code).catch(() => setFailed(true))
                setDeleting(false)
                onBack()
              }}
            >
              {t('family.delete')}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
