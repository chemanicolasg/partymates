import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MemberReport } from '../core/backend'
import { factLabel } from '../core/format'
import { classKpis, csvReport, fmtMinutes, joinLink, PLAN, pupilLine, type PupilLine } from '../core/insights'
import { decodeLook } from '../core/look'
import { teacherWriteStudent, type TeacherClass } from '../core/store'
import { useT } from '../i18n'
import { Character } from '../ui/Character'
import { Modal } from '../ui/kit'
import { Matty } from '../ui/Matty'
import { KIND_ICON } from './art'

const shortDay = (day: string, lang: string) => new Date(`${day}T12:00:00`).toLocaleDateString(lang, { day: 'numeric', month: 'short' })

/** The class at a glance: who played, the routine, how each skill is going and the weeks so far. */
export function ClassInsights({ members, week }: { members: MemberReport[]; week: string }) {
  const { t, lang } = useT()
  const k = classKpis(members, week)
  const peak = Math.max(1, ...k.series.map((w) => w.min))
  const tiles: [string, string, string][] = [
    ['👧', `${k.active}/${k.pupils}`, t('kpi.active')],
    ['📅', `${k.onPlan}/${k.pupils}`, t('kpi.plan')],
    ['⏱️', fmtMinutes(k.minutes), t('kpi.minutes')],
    ['🎯', k.accuracy === null ? '—' : `${k.accuracy} %`, t('kpi.accuracy')],
  ]
  return (
    <section className="card insights">
      <h2>📊 {t('teacher.summary')}</h2>
      <div className="kpis">
        {tiles.map(([icon, value, label]) => (
          <div className="kpi" key={label}>
            <span aria-hidden="true">{icon}</span>
            <strong>{value}</strong>
            <small>{label}</small>
          </div>
        ))}
      </div>
      <p className="plan-note">{t('kpi.planHelp', { days: PLAN.days, min: PLAN.minutes })}</p>

      <h3>{t('insights.skills')}</h3>
      <div className="skill-bars">
        {k.skills.map((s) => (
          <div className="skill" key={s.kind} tabIndex={0} data-tip={s.pct === null ? t('insights.fewData') : t('insights.skillTip', { pct: s.pct, n: s.answers })}>
            <span className="skill-name">
              {KIND_ICON[s.kind]} {t(`skill.${s.kind}`)}
            </span>
            <span className="skill-track">{s.pct === null ? null : <i style={{ width: `${s.pct}%` }} />}</span>
            <span className="skill-value">{s.pct === null ? '—' : `${s.pct} %`}</span>
          </div>
        ))}
      </div>
      {k.strongest && k.weakest ? (
        <p className="insight-line">
          💪 {t('insights.strong', { skill: t(`skill.${k.strongest}`) })} · 🧩 {t('insights.weak', { skill: t(`skill.${k.weakest}`) })}
        </p>
      ) : null}

      {k.series.length > 1 ? (
        <>
          <h3>{t('insights.weeks')}</h3>
          <div className="week-chart" role="img" aria-label={t('insights.weeks')}>
            {k.series.map((w, i) => (
              <div className="week-col" key={w.week} tabIndex={0} data-tip={t('insights.weekTip', { day: shortDay(w.week, lang), min: fmtMinutes(w.min), n: w.active })}>
                {/* Only the latest week carries its number: the rest are a hover away and in the export. */}
                <span className="week-value">{i === k.series.length - 1 ? fmtMinutes(w.min) : ''}</span>
                <span className="week-bar" style={{ height: `${Math.max(2, (w.min / peak) * 100)}%` }} />
                <small>{shortDay(w.week, lang)}</small>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {k.hard.length ? (
        <>
          <h3>{t('teacher.hard')}</h3>
          <div className="weak-facts">
            {k.hard.map(([key, n]) => (
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

type SortKey = 'num' | 'stars' | 'weekMin' | 'totalMin' | 'accuracy'
const sortValue: Record<SortKey, (l: PupilLine) => number> = {
  num: (l) => l.m.num,
  stars: (l) => -l.m.stars,
  weekMin: (l) => -l.weekMin,
  totalMin: (l) => -l.totalMin,
  accuracy: (l) => (l.accuracy === null ? 1 : -l.accuracy),
}

/** Every pupil on one line, for a wide screen: time, routine, accuracy, what to reinforce and the teacher's note. */
export function PupilTable({ members, week, cls }: { members: MemberReport[]; week: string; cls: TeacherClass }) {
  const { t, lang } = useT()
  const [sort, setSort] = useState<SortKey>('num')
  const lines = members.map((m) => pupilLine(m, week)).sort((a, b) => sortValue[sort](a) - sortValue[sort](b) || a.m.num - b.m.num)
  const head = (key: SortKey, label: string) => (
    <th aria-sort={sort === key ? 'ascending' : undefined}>
      <button className={`th-sort${sort === key ? ' on' : ''}`} onClick={() => setSort(key)}>
        {label}
      </button>
    </th>
  )
  const exportCsv = () => {
    const head = ['n', 'name', 'stars', 'weekMin', 'days', 'totalMin', 'accuracy', 'strong', 'weak', 'facts', 'last', 'note'].map((c) => t(`csv.${c}` as 'csv.n'))
    const csv = csvReport(members, week, cls.names, cls.notes, head, (kind) => t(`skill.${kind}`))
    // The byte-order mark makes spreadsheets read the accents right.
    const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `matty-${cls.code}-${week}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  if (!members.length) return null
  return (
    <section className="card pupil-table-card">
      <div className="teacher-row-head">
        <h2>📋 {t('table.title')}</h2>
        <button className="btn btn-small" onClick={exportCsv}>
          ⬇️ {t('table.export')}
        </button>
      </div>
      <div className="pupil-table">
        <table>
          <thead>
            <tr>
              {head('num', t('csv.n'))}
              <th>{t('csv.name')}</th>
              {head('stars', '⭐')}
              {head('weekMin', t('table.week'))}
              {head('totalMin', t('table.total'))}
              {head('accuracy', t('kpi.accuracy'))}
              <th>{t('table.reinforce')}</th>
              <th>{t('csv.note')}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.m.id} className={l.active ? '' : 'idle'}>
                <td>{l.m.num}</td>
                <td>
                  <span className="pupil-who">
                    <Character look={decodeLook(l.m.look)} size={30} />
                    {cls.names[l.m.num] || l.m.name}
                  </span>
                </td>
                <td>{l.m.stars}</td>
                <td>
                  {fmtMinutes(l.weekMin)}
                  <span className="plan-dots" title={t('table.days', { n: l.days, plan: PLAN.days })}>
                    {Array.from({ length: PLAN.days }, (_, i) => (
                      <i key={i} className={i < l.days ? 'on' : ''} />
                    ))}
                  </span>
                </td>
                <td>{fmtMinutes(l.totalMin)}</td>
                <td>{l.accuracy === null ? '—' : `${l.accuracy} %`}</td>
                <td className="pupil-weak">
                  {l.weakest ? <span>{t(`skill.${l.weakest}`)}</span> : null}
                  {(l.m.stats?.weak ?? []).slice(0, 3).map((key) => (
                    <b key={key}>{factLabel(key, lang)}</b>
                  ))}
                </td>
                <td>
                  <input
                    className="note-input"
                    defaultValue={cls.notes[l.m.num] ?? ''}
                    maxLength={600}
                    placeholder="✏️"
                    aria-label={`${t('csv.note')} ${l.m.num}`}
                    onBlur={(e) => {
                      if (e.target.value.trim() !== (cls.notes[l.m.num] ?? '')) teacherWriteStudent(cls.code, l.m.num, { note: e.target.value.trim() })
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <small>{t('table.legend', { plan: PLAN.days })}</small>
    </section>
  )
}

/** Cards to print and hand out: each one takes a child (or the family at home) straight into the class. */
export function AccessCards({ cls, pupils, onClose }: { cls: TeacherClass; pupils: number; onClose: () => void }) {
  const { t } = useT()
  const [count, setCount] = useState(Math.min(40, Math.max(pupils, 25)))
  const [qr, setQr] = useState<((text: string) => string) | null>(null)
  const origin = window.location.origin
  const host = window.location.host

  useEffect(() => {
    // The QR drawing code is only fetched when somebody opens this dialog.
    void import('qrcode-generator').then(({ default: make }) =>
      setQr(() => (text: string) => {
        const code = make(0, 'M')
        code.addData(text)
        code.make()
        return code.createSvgTag({ scalable: true, margin: 0 })
      }),
    )
  }, [])

  const card = (num: number) => (
    <div className="access-card" key={num}>
      <div className="access-top">
        <strong className="access-brand">
          Matt<b>y</b>
        </strong>
        <span>{cls.name}</span>
      </div>
      <div className="access-body">
        {/* The drawing is generated on this device from our own link: nothing external goes in. */}
        <span className="access-qr" dangerouslySetInnerHTML={{ __html: qr ? qr(joinLink(origin, cls.code, num)) : '' }} />
        <div>
          <small>{t('cards.number')}</small>
          <strong className="access-num">{num}</strong>
        </div>
      </div>
      <p>
        {t('cards.how', { host })} <b>{cls.code}</b> · {t('cards.number')} <b>{num}</b>
      </p>
    </div>
  )
  const sheet = (
    <div className="access-sheet">
      <div className="access-letter">
        <Matty pose="hi" size={70} />
        <div>
          <h2>{t('cards.letterTitle', { name: cls.name })}</h2>
          <p>{t('cards.letter', { host, code: cls.code, days: PLAN.days, min: PLAN.minutes })}</p>
        </div>
      </div>
      <div className="access-grid">{Array.from({ length: count }, (_, i) => card(i + 1))}</div>
    </div>
  )
  return (
    <>
      <Modal onClose={onClose}>
        <h2>🎫 {t('cards.title')}</h2>
        <p>{t('cards.about')}</p>
        <label className="field cards-count">
          <span>{t('cards.count')}</span>
          <input type="number" min={1} max={60} value={count} onChange={(e) => setCount(Math.max(1, Math.min(60, Number(e.target.value) || 1)))} />
        </label>
        <div className="access-preview">{card(1)}</div>
        <div className="btn-row">
          <button className="btn btn-primary" disabled={!qr} onClick={() => window.print()}>
            🖨️ {t('cards.print')}
          </button>
          <button className="btn" onClick={onClose}>
            {t('back')}
          </button>
        </div>
      </Modal>
      {/* Outside the app's own tree, so printing shows the sheet and nothing else. */}
      {createPortal(<div className="print-only">{sheet}</div>, document.body)}
    </>
  )
}
