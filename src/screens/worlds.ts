import type { WorldId } from '../core/types'

export const WORLD_ART: Record<WorldId, { icon: string; scene: string[] }> = {
  blocks: { icon: '⛏️', scene: ['🌲', '🧱', '⛏️', '🌳'] },
  party: { icon: '🎲', scene: ['🎈', '🎲', '🎪', '🎉'] },
  arena: { icon: '⚡', scene: ['🌩️', '🤖', '⚡', '🛸'] },
  bay: { icon: '💎', scene: ['🌴', '💎', '🏴‍☠️', '⛵'] },
}
