import { sfx } from '../core/audio'
import { go } from '../core/nav'
import { dayKey, levelProgress, playerLevel } from '../core/scoring'
import { selectProfile, setMusic, totalStars, useApp, useProfile, worldStars } from '../core/store'
import { LEVELS_PER_WORLD, WORLDS } from '../core/types'
import { useT } from '../i18n'
import { Chip, ProfileAvatar } from '../ui/kit'
import { WORLD_ART } from './worlds'

export function HubScreen() {
  const { t } = useT()
  const p = useProfile()
  const music = useApp((s) => s.music)
  const dojoDue = p.dojo.lastDay !== dayKey()
  const open = (fn: () => void) => () => {
    sfx('tap')
    fn()
  }

  return (
    <div className="screen hub">
      <header className="hub-top">
        <button className="hub-me" onClick={open(() => go({ id: 'shop' }))} aria-label={t('nav.shop')}>
          <ProfileAvatar p={p} size={52} />
          <span className="hub-me-text">
            <strong>{p.name}</strong>
            <small>{t('hub.level', { n: playerLevel(p.xp) })}</small>
            <span className="xp-bar">
              <i style={{ width: `${levelProgress(p.xp) * 100}%` }} />
            </span>
          </span>
        </button>
        <div className="hub-chips">
          <Chip icon="⭐" label={t('hub.stars')}>
            {totalStars(p)}
          </Chip>
          <Chip icon="🪙" label={t('hub.coins')}>
            {p.coins}
          </Chip>
          <Chip icon="🔥" label={t('hub.streak')}>
            {p.dojo.streak}
          </Chip>
          <button className={`chip music-toggle${music ? '' : ' off'}`} onClick={() => setMusic(!music)} aria-pressed={music} aria-label={t('music')}>
            {music ? '🎵' : '🔇'}
          </button>
        </div>
      </header>

      <main className="sea">
        <span className="cloud c1">☁️</span>
        <span className="cloud c2">☁️</span>
        <div className="islands">
          {WORLDS.map((w, i) => (
            <button key={w} className={`island island-${w}`} style={{ animationDelay: `${i * -1.3}s` }} onClick={open(() => go({ id: 'world', world: w }))}>
              <span className="island-scene" aria-hidden="true">
                {WORLD_ART[w].scene.map((e, k) => (
                  <span key={k}>{e}</span>
                ))}
              </span>
              <strong>{t(`world.${w}`)}</strong>
              <small>{t(`world.${w}.tag`)}</small>
              <span className="island-stars">
                ⭐ {worldStars(p, w)}/{LEVELS_PER_WORLD * 3}
              </span>
            </button>
          ))}
        </div>
      </main>

      <nav className="dock">
        <button className={`dock-btn dojo${dojoDue ? ' due' : ''}`} onClick={open(() => go({ id: 'dojo' }))}>
          <span>⚡</span>
          {t('nav.dojo')}
        </button>
        <button className="dock-btn" onClick={open(() => go({ id: 'class' }))}>
          <span>🏫</span>
          {t('nav.class')}
        </button>
        <button className="dock-btn" onClick={open(() => go({ id: 'shop' }))}>
          <span>🛍️</span>
          {t('nav.shop')}
        </button>
        <button className="dock-btn" onClick={open(() => go({ id: 'grownups' }))}>
          <span>🧑‍🏫</span>
          {t('nav.grownups')}
        </button>
        <button
          className="dock-btn"
          onClick={open(() => {
            selectProfile(null)
            go({ id: 'welcome' }, { reset: true })
          })}
        >
          <span>👥</span>
          {t('nav.switch')}
        </button>
      </nav>
    </div>
  )
}
