import { useRef, useState } from 'react'
import { cloudConfig } from '../core/backend'
import { DOJO } from '../core/curriculum'
import { factLabel } from '../core/format'
import { back, go } from '../core/nav'
import { memoryStats } from '../core/srs'
import { deleteProfile, setBand, setMusic, setSound, totalStars, useApp, useProfile, weekMinutes, zoneStars, ZONE_MAX_STARS } from '../core/store'
import { BANDS, KINDS, ZONES } from '../core/types'
import { useT } from '../i18n'
import { ProfileAvatar } from '../ui/Character'
import { Modal, TopBar } from '../ui/kit'
import { KIND_ICON, ZONE_ICON } from './art'
import { TeacherPanel } from './TeacherPanel'
import { LangPicker } from './WelcomeScreen'

const METHODS = ['montessori', 'kumon', 'cpa', 'srs', 'play'] as const
const HOLD_MS = 1500

export function GrownUpsScreen() {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'family' | 'teacher'>('family')
  const [holding, setHolding] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const press = () => {
    setHolding(true)
    timer.current = window.setTimeout(() => setOpen(true), HOLD_MS)
  }
  const release = () => {
    setHolding(false)
    clearTimeout(timer.current)
  }

  return (
    <div className="screen grownups">
      <TopBar title={`🧑‍🏫 ${t('nav.grownups')}`} onBack={back} />
      {open ? (
        <>
          <div className="tabs gu-tabs" role="tablist">
            {(['family', 'teacher'] as const).map((k) => (
              <button key={k} role="tab" aria-selected={k === tab} className={`tab${k === tab ? ' on' : ''}`} onClick={() => setTab(k)}>
                {t(`gu.tab.${k}`)}
              </button>
            ))}
          </div>
          {tab === 'family' ? <Report /> : <TeacherPanel />}
        </>
      ) : (
        <div className="gate center">
          <div className="card intro-card">
            <span className="result-art">🔒</span>
            <h1>{t('gu.gate')}</h1>
            <p>{t('gu.gateHelp')}</p>
            <button
              className={`btn btn-primary btn-big hold${holding ? ' holding' : ''}`}
              onPointerDown={press}
              onPointerUp={release}
              onPointerLeave={release}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !e.repeat && press()}
              onKeyUp={release}
              onContextMenu={(e) => e.preventDefault()}
            >
              {t('gu.hold')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Report() {
  const { t, lang } = useT()
  const p = useProfile()
  const sound = useApp((s) => s.sound)
  const music = useApp((s) => s.music)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const memory = memoryStats(p.facts)
  const minutes = Math.round(p.stats.playMs / 60000)

  return (
    <div className="report">
      <section className="card report-head">
        <ProfileAvatar p={p} size={64} />
        <div>
          <h2>{p.name}</h2>
          <p>
            ⭐ {totalStars(p)} · ⏱️ {t('gu.minutes', { n: minutes })} · {t('gu.thisWeek', { n: weekMinutes(p) })} · 🔥 {p.dojo.streak}
          </p>
        </div>
      </section>

      <section className="card">
        <h2>{t('gu.track')}</h2>
        <p>{t('gu.trackHelp')}</p>
        <div className="bands compact">
          {BANDS.map((b) => (
            <button key={b} className={`band${b === p.band ? ' on' : ''}`} onClick={() => setBand(p.id, b)} aria-pressed={b === p.band}>
              <strong>{t(`band.${b}`)}</strong>
              <small>{t(`band.${b}.grade`)}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>{t('gu.progress')}</h2>
        {ZONES.map((z) => (
          <div className="report-row" key={z}>
            <span className="report-world">
              {ZONE_ICON[z]} {t(`zone.${z}`)}
            </span>
            <span>
              ⭐ {zoneStars(p, z)}/{ZONE_MAX_STARS}
            </span>
            <span className="report-acc">
              <span className="meter">
                <i style={{ width: `${(zoneStars(p, z) / ZONE_MAX_STARS) * 100}%` }} />
              </span>
            </span>
          </div>
        ))}
        <h2>{t('gu.byKind')}</h2>
        {KINDS.map((k) => {
          const s = p.stats.byKind[k]
          const acc = s?.total ? Math.round((s.ok / s.total) * 100) : null
          return (
            <div className="report-row" key={k}>
              <span className="report-world">
                {KIND_ICON[k]} {t(`mission.${k}`)}
                <small>{t(`kind.${k}.skill`)}</small>
              </span>
              <span />
              <span className="report-acc">
                <span className="meter">
                  <i style={{ width: `${acc ?? 0}%` }} />
                </span>
                {acc === null ? '–' : `${acc} %`}
              </span>
            </div>
          )
        })}
        <div className="report-row">
          <span className="report-world">
            ⚡ {t('dojo.title')}
            <small>{t('gu.dojoSkill')}</small>
          </span>
          <span>{t('dojo.sheet', { n: p.dojo.step + 1, total: DOJO.length })}</span>
          <span className="report-acc">
            <b>{DOJO[p.dojo.step].label}</b>
          </span>
        </div>
      </section>

      <section className="card">
        <h2>{t('gu.memory')}</h2>
        <p>{t('gu.memoryStats', { seen: memory.seen, mastered: memory.mastered, due: memory.due })}</p>
        {memory.weak.length ? (
          <>
            <p>{t('gu.weak')}</p>
            <div className="weak-facts">
              {memory.weak.slice(0, 10).map((k) => (
                <span key={k}>{factLabel(k, lang)}</span>
              ))}
            </div>
          </>
        ) : null}
      </section>

      <section className="card">
        <h2>{t('gu.methods')}</h2>
        {METHODS.map((m) => (
          <details key={m}>
            <summary>{t(`gu.m.${m}`)}</summary>
            <p>{t(`gu.m.${m}.text`)}</p>
          </details>
        ))}
      </section>

      <section className="card">
        <h2>{t('gu.settings')}</h2>
        <LangPicker />
        <label className="toggle">
          <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
          <span>🔊 {t('gu.sound')}</span>
        </label>
        <label className="toggle">
          <input type="checkbox" checked={music} onChange={(e) => setMusic(e.target.checked)} />
          <span>🎵 {t('music')}</span>
        </label>
        <p className="privacy">🔐 {t(cloudConfig() ? 'gu.privacyCloud' : 'gu.privacyLocal')}</p>
        <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
          🗑️ {t('gu.delete')}
        </button>
      </section>

      {confirmDelete ? (
        <Modal onClose={() => setConfirmDelete(false)}>
          <h2>{t('gu.deleteAsk', { name: p.name })}</h2>
          <p>{t('gu.deleteHelp')}</p>
          <div className="btn-row">
            <button className="btn" onClick={() => setConfirmDelete(false)}>
              {t('no')}
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                deleteProfile(p.id)
                go({ id: 'welcome' }, { reset: true })
              }}
            >
              {t('gu.delete')}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
