import { dayKey } from './scoring'
import type { Band } from './types'
import type { World } from './worlds'

/**
 * Seasons: for a few weeks the whole game dresses up, the wardrobe sells special items and a short
 * extra world appears with a prize at the end. Launching a new one is adding an entry to SEASONS
 * (dates, items, themes of its world), its drawings in ui/scene.tsx and its texts in i18n.
 */
export type SeasonId = 'halloween' | 'xmas'

export interface Season {
  id: SeasonId
  /** First and last day, as [month, day]. A season may run over New Year. */
  from: [number, number]
  to: [number, number]
  /** Wardrobe items on sale only while it lasts (they are kept for ever once bought). */
  items: string[]
  /** Item given for finishing the season's world. */
  prize: string
  /** Themes of the stops of its world, for each age band. */
  stops: Record<Band, string[]>
}

export const SEASONS: Season[] = [
  {
    id: 'halloween',
    from: [10, 17],
    to: [11, 2],
    items: ['hat:witch', 'outfit:skeleton', 'pet:🦇'],
    prize: 'hat:pumpkin',
    stops: {
      A: ['n20', 'add10', 'sub10', 'add20', 'n100'],
      B: ['add2d', 'sub2d', 'addCarry', 'subBorrow', 'x2510'],
      C: ['x34', 'x67', 'd2510', 'n1000', 'xAll'],
      D: ['xAll', 'dAll', 'ndec', 'fOf', 'nneg'],
    },
  },
  {
    id: 'xmas',
    from: [12, 1],
    to: [1, 6],
    items: ['hat:santa', 'hat:antlers', 'outfit:xmas', 'pet:⛄'],
    prize: 'hat:elf',
    stops: {
      A: ['add10', 'n20', 'sub10', 'n100', 'add20'],
      B: ['addCarry', 'x2510', 'subBorrow', 'n100', 'x34'],
      C: ['xAll', 'dAll', 'n1000', 'dRem', 'fBuild'],
      D: ['pct', 'fOf', 'ndec', 'dAll', 'nneg'],
    },
  },
]

export const SEASON_BY_ID: Record<string, Season> = Object.fromEntries(SEASONS.map((s) => [s.id, s]))
/** Every item that belongs to a season, whether on sale or a prize. */
export const SEASON_OF_ITEM: Record<string, SeasonId> = Object.fromEntries(SEASONS.flatMap((s) => [...s.items, s.prize].map((i) => [i, s.id])))

/** What the grown-ups chose: follow the calendar, never, or one season fixed (to have a look at it). */
export type SeasonSetting = 'auto' | 'off' | SeasonId

const stamp = ([m, d]: [number, number]) => m * 100 + d

/** The season running on a date, going by the calendar alone. */
export function seasonOn(date: Date): Season | null {
  const today = stamp([date.getMonth() + 1, date.getDate()])
  return (
    SEASONS.find((s) => {
      const [a, b] = [stamp(s.from), stamp(s.to)]
      return a <= b ? today >= a && today <= b : today >= a || today <= b
    }) ?? null
  )
}

export function currentSeason(setting: SeasonSetting = 'auto', now = new Date()): Season | null {
  if (setting === 'off') return null
  return setting === 'auto' ? seasonOn(now) : (SEASON_BY_ID[setting] ?? null)
}

/** The year a running season started in: each year's edition keeps its own progress. */
export function seasonYear(season: Season, now = new Date()): number {
  const wraps = stamp(season.from) > stamp(season.to)
  return wraps && stamp([now.getMonth() + 1, now.getDate()]) <= stamp(season.to) ? now.getFullYear() - 1 : now.getFullYear()
}

/** The extra world of a season for a child of a given age. Its name comes from the translations. */
export function seasonWorld(season: Season, band: Band, now = new Date()): World {
  return {
    id: `${season.id}-${seasonYear(season, now)}`,
    name: '',
    scene: season.id,
    stops: season.stops[band].map((topic) => ({ t: 'topic', topic })),
  }
}

/** Day a season ends this time round, for "until…" notes. */
export function seasonEnd(season: Season, now = new Date()): string {
  const year = seasonYear(season, now) + (stamp(season.from) > stamp(season.to) ? 1 : 0)
  return dayKey(new Date(year, season.to[0] - 1, season.to[1]).getTime())
}
