import type { PlayKind, ZoneId } from '../core/types'

/** Icon of each kind of activity, shown on the map so children see the variety ahead. */
export const KIND_ICON: Record<PlayKind, string> = { blocks: '🧱', party: '🎲', arena: '⚡', bay: '💎', stones: '👣', pairs: '🃏', quiz: '✏️' }
/** Three pictograms per activity for the "how to play" strip. */
export const HOW_ICONS: Record<PlayKind, [string, string, string]> = {
  blocks: ['🧱', '🔨', '🚩'],
  party: ['🎲', '🧮', '📍'],
  arena: ['👀', '🃏', '💥'],
  bay: ['💎', '🤝', '✔️'],
  stones: ['🔢', '👆', '🏁'],
  pairs: ['🧮', '👉', '🔗'],
  quiz: ['👀', '🔢', '✔️'],
}
/** The five stations of the number-sense mission. */
export const TASK_ICON = { dots: '🔴', cmpDots: '⚖️', cmpNum: '🔢', line: '📏', facts: '⚡' } as const
export const ZONE_ICON: Record<ZoneId, string> = { beach: '🏖️', jungle: '🌴', mountain: '⛰️', space: '🚀' }
