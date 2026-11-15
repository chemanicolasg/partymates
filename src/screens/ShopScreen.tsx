import { useState } from 'react'
import { sfx } from '../core/audio'
import { HAIR_COLORS, HAIR_STYLES, ITEMS, itemName, SKIN_TONES, type Item, type ItemType, type Look } from '../core/look'
import { back } from '../core/nav'
import { isItemUnlocked, styleKid, takeOff, totalStars, useProfile, wearItem } from '../core/store'
import { useT } from '../i18n'
import { Character } from '../ui/Character'
import { Chip, TopBar } from '../ui/kit'

const TABS: ItemType[] = ['base', 'hat', 'glasses', 'outfit', 'pet', 'bg']
const FIELD: Record<ItemType, keyof Look> = { base: 'base', hat: 'hat', glasses: 'glasses', outfit: 'outfit', pet: 'pet', bg: 'bg' }
const REMOVABLE: ItemType[] = ['hat', 'glasses', 'pet']

/** The wardrobe: everything is tried on the player's own character, bought with points or unlocked with stars. */
export function ShopScreen() {
  const { t } = useT()
  const p = useProfile()
  const [tab, setTab] = useState<ItemType>('base')
  const stars = totalStars(p)
  const wearing = (item: Item) => p.look[FIELD[item.type]] === itemName(item.id)

  const tap = (item: Item) => {
    const had = isItemUnlocked(p, item.id)
    if (wearItem(item.id)) sfx(had ? 'tap' : 'coin')
    else sfx('bad')
  }

  return (
    <div className="screen shop">
      <TopBar title={`👕 ${t('nav.shop')}`} onBack={back}>
        <Chip icon="⭐">{stars}</Chip>
        <Chip icon="🪙">{p.coins}</Chip>
      </TopBar>
      <div className="shop-body">
        <div className="shop-preview">
          <Character look={p.look} size={150} bounce />
          <small>{t('shop.earn')}</small>
        </div>
        <div className="tabs wrap" role="tablist">
          {TABS.map((k) => (
            <button key={k} role="tab" aria-selected={k === tab} className={`tab${k === tab ? ' on' : ''}`} onClick={() => setTab(k)}>
              {t(`shop.${k}`)}
            </button>
          ))}
        </div>

        {tab === 'base' && p.look.base === 'kid' ? <KidStyle look={p.look} /> : null}

        <div className="shop-grid">
          {REMOVABLE.includes(tab) ? (
            <button
              className={`shop-item${p.look[FIELD[tab]] === null ? ' on' : ''}`}
              onClick={() => {
                sfx('tap')
                takeOff(tab as 'hat' | 'glasses' | 'pet')
              }}
            >
              <span className="shop-none">🚫</span>
              <small>{t('shop.none')}</small>
            </button>
          ) : null}
          {ITEMS.filter((i) => i.type === tab).map((item) => {
            const unlocked = isItemUnlocked(p, item.id)
            const locked = !unlocked && (item.stars !== undefined || p.coins < item.price)
            return (
              <button key={item.id} className={`shop-item${wearing(item) ? ' on' : ''}${locked ? ' poor' : ''}`} onClick={() => tap(item)} aria-pressed={wearing(item)}>
                {item.type === 'pet' ? (
                  <span className="shop-emoji">{item.value}</span>
                ) : (
                  <Character look={{ ...p.look, pet: null, [FIELD[item.type]]: itemName(item.id) }} size={72} />
                )}
                <small>
                  {wearing(item) ? `✔ ${t('shop.on')}` : unlocked ? t('shop.use') : item.stars !== undefined ? `⭐ ${item.stars}` : `🪙 ${item.price}`}
                </small>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** Skin, hair style and hair colour of the child character: always free. */
export function KidStyle({ look, onChange }: { look: Look; onChange?: (patch: Partial<Look>) => void }) {
  const { t } = useT()
  const set = (patch: Partial<Pick<Look, 'tone' | 'hair' | 'hairColor'>>) => {
    sfx('tap')
    if (onChange) onChange(patch)
    else styleKid(patch)
  }
  return (
    <div className="kid-style card">
      <div className="pick-row" role="group" aria-label={t('shop.skin')}>
        {SKIN_TONES.map((c, i) => (
          <button type="button" key={c} className={`pick swatch${look.tone === i ? ' on' : ''}`} style={{ background: c }} onClick={() => set({ tone: i })} aria-pressed={look.tone === i} aria-label={`${t('shop.skin')} ${i + 1}`} />
        ))}
      </div>
      <div className="pick-row" role="group" aria-label={t('shop.hair')}>
        {HAIR_STYLES.map((h) => (
          <button type="button" key={h} className={`pick face${look.hair === h ? ' on' : ''}`} onClick={() => set({ hair: h })} aria-pressed={look.hair === h} aria-label={`${t('shop.hair')} ${h}`}>
            <Character look={{ ...look, hair: h, hat: null, glasses: null, pet: null }} size={44} />
          </button>
        ))}
      </div>
      <div className="pick-row" role="group" aria-label={t('shop.hairColor')}>
        {HAIR_COLORS.map((c, i) => (
          <button type="button" key={c} className={`pick swatch${look.hairColor === i ? ' on' : ''}`} style={{ background: c }} onClick={() => set({ hairColor: i })} aria-pressed={look.hairColor === i} aria-label={`${t('shop.hairColor')} ${i + 1}`} />
        ))}
      </div>
    </div>
  )
}
