/**
 * Characters and their outfits. Everything is drawn by the app itself (see ui/Character.tsx);
 * nothing here can be bought with real money: points only come from playing.
 */
export type ItemType = 'base' | 'hat' | 'glasses' | 'outfit' | 'pet' | 'bg'

export interface Item {
  id: string
  type: ItemType
  /** Points needed to buy it; 0 = free from the start. */
  price: number
  /** Unlocked for free once the player has this many stars, instead of being bought. */
  stars?: number
  /** Won by finishing a season's world: it cannot be bought. */
  prize?: boolean
  /** Only for pets (an emoji) and backgrounds (a CSS colour). */
  value?: string
}

export interface Look {
  base: string
  /** Kid only: skin tone, hair style and hair colour are free choices, not shop items. */
  tone: number
  hair: string
  hairColor: number
  hat: string | null
  glasses: string | null
  outfit: string
  pet: string | null
  bg: string
}

export const SKIN_TONES = ['#ffe0c2', '#f6c9a0', '#e3a977', '#c68a5a', '#9a6238', '#6b4226']
export const HAIR_COLORS = ['#3a2a1e', '#7a4a21', '#d8a03a', '#e8643c', '#1d1b26', '#b06cff', '#ff7ab8']
export const HAIR_STYLES = ['short', 'swept', 'spiky', 'curly', 'bob', 'long', 'buns', 'pony']

const item = (type: ItemType, name: string, price = 0, extra: Partial<Item> = {}): Item => ({ id: `${type}:${name}`, type, price, ...extra })
const starItem = (type: ItemType, name: string, stars: number): Item => ({ id: `${type}:${name}`, type, price: 0, stars })
const prizeItem = (type: ItemType, name: string): Item => ({ id: `${type}:${name}`, type, price: 0, prize: true })
const pet = (emoji: string, price: number) => item('pet', emoji, price, { value: emoji })
const bg = (name: string, value: string, price = 0) => item('bg', name, price, { value })

export const ITEMS: Item[] = [
  item('base', 'kid'), item('base', 'fox'), item('base', 'panda'), item('base', 'cat'), item('base', 'dog'), item('base', 'bunny'),
  item('base', 'frog', 30), item('base', 'bear', 40), item('base', 'lion', 60), item('base', 'tiger', 60), item('base', 'monkey', 80),
  item('base', 'koala', 80), item('base', 'penguin', 100), item('base', 'robot', 140), item('base', 'alien', 160),
  item('base', 'unicorn', 200), item('base', 'dragon', 240),

  item('hat', 'cap', 30), item('hat', 'beanie', 30), item('hat', 'bow', 40), item('hat', 'party', 40), item('hat', 'headphones', 60),
  item('hat', 'cowboy', 70), item('hat', 'tophat', 80), item('hat', 'pirate', 90), item('hat', 'chef', 90), item('hat', 'wizard', 120),
  item('hat', 'viking', 130), item('hat', 'astro', 150), starItem('hat', 'matty', 12), starItem('hat', 'grad', 30), starItem('hat', 'crown', 60),

  // Seasonal: on sale only during their season (see core/seasons.ts), kept for ever.
  item('hat', 'witch', 60), prizeItem('hat', 'pumpkin'), item('hat', 'santa', 60), item('hat', 'antlers', 60), prizeItem('hat', 'elf'),

  item('glasses', 'round', 30), item('glasses', 'sun', 50), item('glasses', 'patch', 60), item('glasses', 'star', 70),
  item('glasses', 'heart', 70), item('glasses', 'goggles', 80), item('glasses', '3d', 90), item('glasses', 'monocle', 100),

  item('outfit', 'tee-blue'), item('outfit', 'tee-red'), item('outfit', 'tee-green'), item('outfit', 'tee-yellow'), item('outfit', 'tee-purple'),
  item('outfit', 'stripes', 30), item('outfit', 'hoodie', 40), item('outfit', 'football', 60), item('outfit', 'dungarees', 60),
  item('outfit', 'pirate', 90), item('outfit', 'lab', 100), item('outfit', 'ninja', 110), item('outfit', 'wizard', 120),
  item('outfit', 'tux', 120), item('outfit', 'hero', 140), item('outfit', 'astro', 160), starItem('outfit', 'royal', 90),
  item('outfit', 'skeleton', 90), item('outfit', 'xmas', 90),

  pet('🐥', 50), pet('🐢', 60), pet('🐝', 70), pet('🦜', 90), pet('🦋', 110), pet('🐳', 140), pet('🦉', 170), pet('⭐', 220), pet('🦇', 80), pet('⛄', 80),

  bg('sun', '#ffd23f'), bg('sky', '#5cc8ff'), bg('mint', '#6fe3a5'), bg('rose', '#ff8fb8'),
  bg('lava', 'linear-gradient(135deg,#ff4d6d,#ffb347)', 90),
  bg('ocean', 'linear-gradient(135deg,#00c6ff,#5b3fd6)', 90),
  bg('jungle', 'linear-gradient(135deg,#b5f44a,#0fa36b)', 90),
  bg('galaxy', 'linear-gradient(135deg,#2b1b6b,#b06cff 60%,#ff7ac3)', 160),
  bg('rainbow', 'linear-gradient(135deg,#ff4d6d,#ffd23f,#6fe3a5,#5cc8ff,#b06cff)', 240),
]

export const ITEM_BY_ID: Record<string, Item> = Object.fromEntries(ITEMS.map((i) => [i.id, i]))
export const FREE_ITEMS = ITEMS.filter((i) => i.price === 0 && !i.stars && !i.prize).map((i) => i.id)
export const STARTER_BASES = ITEMS.filter((i) => i.type === 'base' && i.price === 0)
export const STARTER_BGS = ITEMS.filter((i) => i.type === 'bg' && i.price === 0)
export const itemName = (id: string) => id.slice(id.indexOf(':') + 1)
export const bgValue = (look: Look) => ITEM_BY_ID[`bg:${look.bg}`]?.value ?? '#ffd23f'

export const DEFAULT_LOOK: Look = {
  base: 'kid',
  tone: 1,
  hair: 'short',
  hairColor: 0,
  hat: null,
  glasses: null,
  outfit: 'tee-blue',
  pet: null,
  bg: 'sun',
}

/** Compact text form, sent to the class so the teacher sees each child's character. */
export const encodeLook = (l: Look) =>
  [l.base, l.tone, l.hair, l.hairColor, l.hat ?? '', l.glasses ?? '', l.outfit, l.pet ?? '', l.bg].join('|')

export function decodeLook(text: string | null | undefined): Look {
  const p = (text ?? '').split('|')
  if (p.length < 9 || !ITEM_BY_ID[`base:${p[0]}`]) return DEFAULT_LOOK
  return {
    base: p[0],
    tone: Number(p[1]) || 0,
    hair: HAIR_STYLES.includes(p[2]) ? p[2] : 'short',
    hairColor: Number(p[3]) || 0,
    hat: ITEM_BY_ID[`hat:${p[4]}`] ? p[4] : null,
    glasses: ITEM_BY_ID[`glasses:${p[5]}`] ? p[5] : null,
    outfit: ITEM_BY_ID[`outfit:${p[6]}`] ? p[6] : 'tee-blue',
    pet: ITEM_BY_ID[`pet:${p[7]}`] ? p[7] : null,
    bg: ITEM_BY_ID[`bg:${p[8]}`] ? p[8] : 'sun',
  }
}

/** Characters bought as emoji in the first version, mapped to the drawn ones. */
export const LEGACY_SKINS: Record<string, Partial<Look>> = {
  '🦊': { base: 'fox' }, '🐼': { base: 'panda' }, '🐸': { base: 'frog' }, '🐱': { base: 'cat' }, '🐶': { base: 'dog' },
  '🐰': { base: 'bunny' }, '🦁': { base: 'lion' }, '🐯': { base: 'tiger' }, '🐵': { base: 'monkey' }, '🤖': { base: 'robot' },
  '👾': { base: 'alien' }, '🐙': { base: 'alien' }, '🦄': { base: 'unicorn' }, '🐲': { base: 'dragon' }, '🦖': { base: 'dragon' },
  '🧙': { base: 'kid', hat: 'wizard', outfit: 'wizard' }, '🥷': { base: 'kid', outfit: 'ninja' }, '🦸': { base: 'kid', outfit: 'hero' },
}

/** Friendly animals that appear in the stories (never real children). */
export const FRIENDS = ['🐨', '🦝', '🐧', '🦔', '🐹', '🦥']
