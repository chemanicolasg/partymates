import type { Band, LaunchCfg } from './types'

/**
 * The opening game. Matty's rocket runs on stars: bubbles of them float by, and the tank has to be
 * filled exactly to its mark — one star too many and it spills. The sums live in the tank (how much
 * is in, how much is missing), not in a written operation.
 */
export const LAUNCH: Record<Band, LaunchCfg> = {
  // Counting on and seeing small amounts at a glance.
  A: { kind: 'launch', unit: 1, sizes: [1, 2, 3], tank: [3, 8], pips: true, bubbles: 4, rounds: 5 },
  // Adding up to 20 and finding what is missing.
  B: { kind: 'launch', unit: 1, sizes: [1, 2, 3, 4, 5, 6, 7, 8, 9], tank: [9, 20], pips: false, bubbles: 5, rounds: 5 },
  // Fives and tens up to 150.
  C: { kind: 'launch', unit: 5, sizes: [1, 2, 3, 4, 5, 6, 8, 10], tank: [10, 30], pips: false, bubbles: 5, rounds: 5 },
  // Quarters and halves up to 5.
  D: { kind: 'launch', unit: 0.25, sizes: [1, 2, 3, 4, 6, 8], tank: [6, 20], pips: false, bubbles: 5, rounds: 5 },
}

type Rng = () => number
const draw = <T>(xs: T[], rng: Rng): T => xs[Math.floor(rng() * xs.length)]

/** How big the tank of this rocket is, in units: small first, larger towards the last one. */
export function launchTarget(cfg: LaunchCfg, round: number, rng: Rng = Math.random): number {
  const [lo, hi] = cfg.tank
  const step = cfg.rounds > 1 ? (hi - lo) / (cfg.rounds - 1) : 0
  // The first tank is always the smallest; later ones wobble a little so no two games are the same.
  const wobble = round === 0 ? 0 : Math.floor(rng() * 3) - 1
  return Math.max(lo, Math.min(hi, Math.round(lo + step * round) + wobble))
}

/**
 * The size for a bubble that is about to appear, given the others and what the tank still needs.
 * Once the gap is the size of a bubble, that very bubble is there to be found; otherwise there is
 * a bubble of one unit. Either way something always fits, so the child can never get stuck.
 */
export function launchRefill(cfg: LaunchCfg, others: number[], gap: number, rng: Rng = Math.random): number {
  if (cfg.sizes.includes(gap)) {
    if (!others.includes(gap)) return gap
  } else if (!others.includes(1)) return 1
  // Something that would spill, as long as the choice is not all traps: finding the gap is the game.
  const over = cfg.sizes.filter((s) => s > gap && !others.includes(s))
  if (over.length && !others.some((s) => s > gap)) return draw(over, rng)
  const fresh = cfg.sizes.filter((s) => !others.includes(s))
  return draw(fresh.length ? fresh : cfg.sizes, rng)
}

/** A full set of bubbles for a tank that needs `gap` units, in the order they float. */
export function launchBubbles(cfg: LaunchCfg, gap: number, rng: Rng = Math.random): number[] {
  const out: number[] = []
  while (out.length < cfg.bubbles) out.push(launchRefill(cfg, out, gap, rng))
  // Shuffled, so the helpful ones are not always in the same place.
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
