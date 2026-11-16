import { useState } from 'react'
import { sfx } from '../core/audio'
import { EYE_COLORS, FACE_PARTS, HAIR_COLORS, ITEMS, itemName, randomKid, SKIN_TONES, type FacePart, type Item, type ItemType, type KidPatch, type Look } from '../core/look'
import { back } from '../core/nav'
import { SEASON_OF_ITEM } from '../core/seasons'
import { isItemOnOffer, isItemUnlocked, styleKid, takeOff, totalStars, useProfile, useSeason, wearItem } from '../core/store'
import { useT } from '../i18n'
import { Character, CharacterFace } from '../ui/Character'
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
  const season = useSeason()
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
          {ITEMS.filter((i) => i.type === tab && isItemOnOffer(p, i.id, season)).map((item) => {
            const unlocked = isItemUnlocked(p, item.id)
            const locked = !unlocked && (item.stars !== undefined || item.prize || p.coins < item.price)
            const seasonal = !unlocked && SEASON_OF_ITEM[item.id]
            return (
              <button
                key={item.id}
                className={`shop-item${wearing(item) ? ' on' : ''}${locked ? ' poor' : ''}${seasonal ? ' seasonal' : ''}`}
                onClick={() => tap(item)}
                aria-pressed={wearing(item)}
                title={seasonal ? t(item.prize ? 'shop.prize' : 'shop.season') : undefined}
              >
                {item.type === 'pet' ? (
                  <span className="shop-emoji">{item.value}</span>
                ) : (
                  <Character look={{ ...p.look, pet: null, [FIELD[item.type]]: itemName(item.id) }} size={72} />
                )}
                <small>
                  {wearing(item)
                    ? `✔ ${t('shop.on')}`
                    : unlocked
                      ? t('shop.use')
                      : item.prize
                        ? `🎁 ${t('shop.prize')}`
                        : item.stars !== undefined
                          ? `⭐ ${item.stars}`
                          : `${seasonal ? '✨ ' : ''}🪙 ${item.price}`}
                </small>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

type Part = 'tone' | FacePart
const PARTS: { id: Part; icon: string }[] = [
  { id: 'tone', icon: '🎨' },
  { id: 'face', icon: '🙂' },
  { id: 'hair', icon: '💇' },
  { id: 'eyes', icon: '👀' },
  { id: 'brows', icon: '〰️' },
  { id: 'nose', icon: '👃' },
  { id: 'mouth', icon: '👄' },
  { id: 'cheeks', icon: '✨' },
]

/**
 * The face of the child character, part by part: skin, shape, hair, eyes, eyebrows, nose, mouth
 * and cheeks. Everything here is free, and every option is shown on the child's own face.
 */
export function KidStyle({ look, onChange }: { look: Look; onChange?: (patch: Partial<Look>) => void }) {
  const { t } = useT()
  const [part, setPart] = useState<Part>('face')
  const set = (patch: KidPatch) => {
    sfx('tap')
    if (onChange) onChange(patch)
    else styleKid(patch)
  }
  const label = (id: Part) => t(id === 'tone' ? 'shop.skin' : id === 'hair' ? 'shop.hair' : `avatar.${id}`)
  const swatches = (colors: string[], field: 'tone' | 'hairColor' | 'eyeColor', name: string) => (
    <div className="pick-row" role="group" aria-label={name}>
      {colors.map((c, i) => (
        <button type="button" key={c} className={`pick swatch${look[field] === i ? ' on' : ''}`} style={{ background: c }} onClick={() => set({ [field]: i })} aria-pressed={look[field] === i} aria-label={`${name} ${i + 1}`} />
      ))}
    </div>
  )
  return (
    <div className="kid-style card">
      <div className="avatar-tabs" role="tablist">
        {PARTS.map((x) => (
          <button type="button" key={x.id} role="tab" aria-selected={x.id === part} aria-label={label(x.id)} className={`avatar-tab${x.id === part ? ' on' : ''}`} onClick={() => setPart(x.id)}>
            {x.icon}
          </button>
        ))}
        <button
          type="button"
          className="avatar-tab dice"
          aria-label={t('avatar.random')}
          onClick={() => {
            sfx('coin')
            if (onChange) onChange(randomKid())
            else styleKid(randomKid())
          }}
        >
          🎲
        </button>
      </div>
      <strong className="avatar-part">{label(part)}</strong>
      {part === 'tone' ? (
        swatches(SKIN_TONES, 'tone', t('shop.skin'))
      ) : (
        <div className="pick-row" role="group" aria-label={label(part)}>
          {FACE_PARTS[part].map((option) => (
            <button type="button" key={option} className={`pick face${look[part] === option ? ' on' : ''}`} onClick={() => set({ [part]: option })} aria-pressed={look[part] === option} aria-label={`${label(part)} ${option}`}>
              <CharacterFace look={{ ...look, [part]: option }} size={part === 'hair' ? 50 : 52} wide={part === 'hair' || part === 'face'} />
            </button>
          ))}
        </div>
      )}
      {part === 'hair' ? swatches(HAIR_COLORS, 'hairColor', t('shop.hairColor')) : null}
      {part === 'eyes' ? swatches(EYE_COLORS, 'eyeColor', t('avatar.eyeColor')) : null}
    </div>
  )
}
