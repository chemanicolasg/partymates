import type { GameResult } from './types'

/** Stars reward accuracy on the first try: mastery before speed. */
export function starsFor(correct: number, total: number): number {
  const acc = total ? correct / total : 0
  if (acc >= 0.85) return 3
  if (acc >= 0.65) return 2
  if (acc >= 0.45) return 1
  return 0
}

export interface Rewards {
  stars: number
  coins: number
  xp: number
}

export function rewardsFor(result: GameResult, previousStars: number): Rewards {
  const stars = starsFor(result.correct, result.total)
  const firstTimeBonus = Math.max(0, stars - previousStars) * 8
  return {
    stars,
    coins: result.correct * 2 + stars * 3 + firstTimeBonus,
    xp: result.correct * 10 + stars * 20,
  }
}

/** Matty's daily present grows a little for each day in a row, up to five. */
export const giftCoins = (streak: number) => 10 + 2 * Math.min(Math.max(streak, 1), 5)

export const XP_PER_LEVEL = 250
export const playerLevel = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1
export const levelProgress = (xp: number) => (xp % XP_PER_LEVEL) / XP_PER_LEVEL

/** Kumon's standard: a sheet is mastered when it is both accurate and inside the target time. */
export function dojoPassed(correct: number, total: number, sec: number, targetSec: number): boolean {
  return correct / total >= 0.9 && sec <= targetSec
}

export const dayKey = (t = Date.now()) => {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Monday of the week containing `t`, as a day key. */
export function weekStart(t = Date.now()): string {
  const d = new Date(t)
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return dayKey(d.getTime())
}
