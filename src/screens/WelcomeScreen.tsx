import { useState } from 'react'
import { sfx } from '../core/audio'
import { DEFAULT_LOOK, itemName, STARTER_BASES, STARTER_BGS, type Look } from '../core/look'
import { go } from '../core/nav'
import { createProfile, selectProfile, setLang, totalStars, useApp } from '../core/store'
import { BANDS, type Band, type Lang } from '../core/types'
import { LANG_NAMES, useT } from '../i18n'
import { Character, ProfileAvatar } from '../ui/Character'
import { Matty } from '../ui/Matty'
import { KidStyle } from './ShopScreen'

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

export function Logo() {
  return (
    <h1 className="logo-word">
      Matt<span>y</span>
    </h1>
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
        <Matty pose="hi" size={128} bounce />
        <Logo />
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
                <ProfileAvatar p={p} size={72} />
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
  const [look, setLook] = useState<Look>(DEFAULT_LOOK)
  const [band, setBand] = useState<Band | null>(null)
  const ready = name.trim().length > 0 && band !== null
  const change = (patch: Partial<Look>) => setLook({ ...look, ...patch })

  const create = () => {
    if (!ready || !band) return
    sfx('win')
    createProfile(name, look, band)
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
        <Character look={look} size={120} bounce />
      </div>
      <div className="pick-row" role="group" aria-label={t('new.skin')}>
        {STARTER_BASES.map((b) => {
          const base = itemName(b.id)
          return (
            <button type="button" key={b.id} className={`pick face${look.base === base ? ' on' : ''}`} onClick={() => change({ base })} aria-pressed={look.base === base} aria-label={base}>
              <Character look={{ ...look, base }} size={48} />
            </button>
          )
        })}
      </div>
      {look.base === 'kid' ? <KidStyle look={look} onChange={change} /> : null}
      <div className="pick-row" role="group" aria-label={t('new.color')}>
        {STARTER_BGS.map((c) => {
          const bg = itemName(c.id)
          return (
            <button type="button" key={c.id} className={`pick swatch${look.bg === bg ? ' on' : ''}`} style={{ background: c.value }} onClick={() => change({ bg })} aria-pressed={look.bg === bg} aria-label={bg} />
          )
        })}
      </div>
      <label className="field">
        <span>{t('new.name')}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={14} placeholder={t('new.namePh')} autoComplete="off" />
        <small>{t('new.nameHint')}</small>
      </label>
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
