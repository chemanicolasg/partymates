import { useState } from 'react'
import { sfx } from '../core/audio'
import { STARTER_COLORS, STARTER_SKINS } from '../core/items'
import { go } from '../core/nav'
import { createProfile, selectProfile, setLang, totalStars, useApp } from '../core/store'
import { BANDS, type Band, type Lang } from '../core/types'
import { LANG_NAMES, useT } from '../i18n'
import { Avatar, ProfileAvatar } from '../ui/kit'

const BAND_ICON: Record<Band, string> = { A: '🐣', B: '🚀', C: '🦸', D: '🧠' }

export function LangPicker() {
  const lang = useApp((s) => s.lang)
  return (
    <div className="lang-picker" role="group" aria-label="Language">
      {(Object.keys(LANG_NAMES) as Lang[]).map((l) => (
        <button key={l} className={`lang${l === lang ? ' on' : ''}`} onClick={() => setLang(l)} aria-pressed={l === lang}>
          {LANG_NAMES[l]}
        </button>
      ))}
    </div>
  )
}

export function WelcomeScreen() {
  const { t } = useT()
  const profiles = useApp((s) => s.profiles)
  const [creating, setCreating] = useState(profiles.length === 0)
  const enter = (id: string) => {
    sfx('good')
    selectProfile(id)
    go({ id: 'hub' }, { reset: true })
  }

  return (
    <div className="screen welcome center">
      <div className="logo">
        <span className="logo-die">🎲</span>
        <h1>
          Party<span>Mates</span>
        </h1>
        <p>{t('welcome.tagline')}</p>
      </div>
      <LangPicker />
      {creating ? (
        <NewPlayer onCancel={profiles.length ? () => setCreating(false) : undefined} />
      ) : (
        <div className="card who-card">
          <h2>{t('welcome.who')}</h2>
          <div className="who-list">
            {profiles.map((p) => (
              <button key={p.id} className="who" onClick={() => enter(p.id)}>
                <ProfileAvatar p={p} size={64} />
                <strong>{p.name}</strong>
                <small>⭐ {totalStars(p)}</small>
              </button>
            ))}
            <button className="who new" onClick={() => setCreating(true)}>
              <span className="who-plus">+</span>
              <strong>{t('welcome.new')}</strong>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function NewPlayer({ onCancel }: { onCancel?: () => void }) {
  const { t } = useT()
  const [name, setName] = useState('')
  const [skin, setSkin] = useState(STARTER_SKINS[0])
  const [color, setColor] = useState(STARTER_COLORS[0])
  const [band, setBand] = useState<Band | null>(null)
  const ready = name.trim().length > 0 && band !== null

  const create = () => {
    if (!ready || !band) return
    sfx('win')
    createProfile(name, skin.id, color.id, band)
    go({ id: 'hub' }, { reset: true })
  }

  return (
    <form
      className="card new-card"
      onSubmit={(e) => {
        e.preventDefault()
        create()
      }}
    >
      <h2>{t('new.title')}</h2>
      <div className="new-preview">
        <Avatar skin={skin.value} color={color.value} size={84} bounce />
      </div>
      <label className="field">
        <span>{t('new.name')}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={14} placeholder={t('new.namePh')} autoComplete="off" />
        <small>{t('new.nameHint')}</small>
      </label>
      <div className="pick-row" role="group" aria-label={t('new.skin')}>
        {STARTER_SKINS.map((s) => (
          <button type="button" key={s.id} className={`pick${s.id === skin.id ? ' on' : ''}`} onClick={() => setSkin(s)} aria-pressed={s.id === skin.id}>
            {s.value}
          </button>
        ))}
      </div>
      <div className="pick-row" role="group" aria-label={t('new.color')}>
        {STARTER_COLORS.map((c) => (
          <button
            type="button"
            key={c.id}
            className={`pick swatch${c.id === color.id ? ' on' : ''}`}
            style={{ background: c.value }}
            onClick={() => setColor(c)}
            aria-pressed={c.id === color.id}
            aria-label={c.id}
          />
        ))}
      </div>
      <p className="field-label">{t('new.age')}</p>
      <div className="bands">
        {BANDS.map((b) => (
          <button type="button" key={b} className={`band${b === band ? ' on' : ''}`} onClick={() => setBand(b)} aria-pressed={b === band}>
            <span>{BAND_ICON[b]}</span>
            <strong>{t(`band.${b}`)}</strong>
            <small>{t(`band.${b}.grade`)}</small>
          </button>
        ))}
      </div>
      <button className="btn btn-primary btn-big" disabled={!ready}>
        🚀 {t('new.go')}
      </button>
      {onCancel ? (
        <button type="button" className="btn" onClick={onCancel}>
          {t('back')}
        </button>
      ) : null}
    </form>
  )
}
