/** Cosmetic rewards. Nothing here can be bought with real money: coins only come from playing. */
export interface Item {
  id: string
  type: 'skin' | 'pet' | 'color'
  /** Emoji for skins and pets, CSS background for colours. */
  value: string
  price: number
}

const skin = (value: string, price = 0): Item => ({ id: `skin:${value}`, type: 'skin', value, price })
const pet = (value: string, price: number): Item => ({ id: `pet:${value}`, type: 'pet', value, price })
const color = (name: string, value: string, price = 0): Item => ({ id: `color:${name}`, type: 'color', value, price })

export const ITEMS: Item[] = [
  skin('🦊'), skin('🐼'), skin('🐸'), skin('🐱'), skin('🐶'), skin('🐰'),
  skin('🦁', 40), skin('🐯', 40), skin('🐵', 60), skin('🐙', 80), skin('🦖', 100), skin('🤖', 120),
  skin('👾', 150), skin('🦄', 180), skin('🐲', 220), skin('🧙', 260), skin('🥷', 300), skin('🦸', 350),
  pet('🐥', 50), pet('🐢', 60), pet('🐝', 70), pet('🦜', 90), pet('🦋', 110), pet('🐳', 140), pet('🦉', 170), pet('⭐', 220),
  color('sun', '#ffd23f'), color('sky', '#5cc8ff'), color('mint', '#6fe3a5'), color('rose', '#ff8fb8'),
  color('lava', 'linear-gradient(135deg,#ff4d6d,#ffb347)', 90),
  color('ocean', 'linear-gradient(135deg,#00c6ff,#5b3fd6)', 90),
  color('jungle', 'linear-gradient(135deg,#b5f44a,#0fa36b)', 90),
  color('galaxy', 'linear-gradient(135deg,#2b1b6b,#b06cff 60%,#ff7ac3)', 160),
  color('rainbow', 'linear-gradient(135deg,#ff4d6d,#ffd23f,#6fe3a5,#5cc8ff,#b06cff)', 240),
]

export const ITEM_BY_ID: Record<string, Item> = Object.fromEntries(ITEMS.map((i) => [i.id, i]))
export const STARTER_SKINS = ITEMS.filter((i) => i.type === 'skin' && i.price === 0)
export const STARTER_COLORS = ITEMS.filter((i) => i.type === 'color' && i.price === 0)
export const itemValue = (id: string | null | undefined, fallback = '') => (id && ITEM_BY_ID[id]?.value) || fallback

/** Friendly rivals for the party board: never real children. */
export const BOTS = ['🐨', '🦝', '🐧', '🦔', '🐹', '🦥']
