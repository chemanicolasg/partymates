import { useState } from 'react'
import { sfx } from '../core/audio'
import { ITEMS, type Item } from '../core/items'
import { back } from '../core/nav'
import { buyItem, equipItem, useProfile } from '../core/store'
import { useT } from '../i18n'
import { Chip, ProfileAvatar, TopBar } from '../ui/kit'

const TABS: Item['type'][] = ['skin', 'pet', 'color']

export function ShopScreen() {
  const { t } = useT()
  const p = useProfile()
  const [tab, setTab] = useState<Item['type']>('skin')
  const equipped = (item: Item) => p[item.type] === item.id

  const tap = (item: Item) => {
    if (p.owned.includes(item.id)) {
      sfx('tap')
      // Tapping the pet that is already out sends it home.
      if (item.type === 'pet' && equipped(item)) equipItem(null, 'pet')
      else equipItem(item.id)
    } else if (buyItem(item.id)) sfx('coin')
    else sfx('bad')
  }

  return (
    <div className="screen shop">
      <TopBar title={`🛍️ ${t('nav.shop')}`} onBack={back}>
        <Chip icon="🪙">{p.coins}</Chip>
      </TopBar>
      <div className="shop-body">
        <div className="shop-preview">
          <ProfileAvatar p={p} size={110} bounce />
          <strong>{p.name}</strong>
          <small>{t('shop.earn')}</small>
        </div>
        <div className="tabs" role="tablist">
          {TABS.map((k) => (
            <button key={k} role="tab" aria-selected={k === tab} className={`tab${k === tab ? ' on' : ''}`} onClick={() => setTab(k)}>
              {t(`shop.${k}`)}
            </button>
          ))}
        </div>
        <div className="shop-grid">
          {ITEMS.filter((i) => i.type === tab).map((item) => {
            const owned = p.owned.includes(item.id)
            return (
              <button
                key={item.id}
                className={`shop-item${equipped(item) ? ' on' : ''}${!owned && p.coins < item.price ? ' poor' : ''}`}
                onClick={() => tap(item)}
                aria-pressed={equipped(item)}
              >
                {item.type === 'color' ? <span className="shop-swatch" style={{ background: item.value }} /> : <span className="shop-emoji">{item.value}</span>}
                <small>{equipped(item) ? `✔ ${t('shop.on')}` : owned ? t('shop.use') : `🪙 ${item.price}`}</small>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
