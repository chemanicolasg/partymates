import { describe, expect, it } from 'vitest'
import { LAUNCH, launchBubbles, launchRefill, launchTarget } from '../src/core/launch'
import { BANDS } from '../src/core/types'

/** A small repeatable random source, so a failure can be reproduced. */
function seeded(seed: number) {
  let s = seed
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
}

describe('the opening game', () => {
  for (const band of BANDS) {
    const cfg = LAUNCH[band]

    it(`${band}: tanks grow from the smallest and stay inside their range`, () => {
      const rng = seeded(7)
      for (let game = 0; game < 50; game++) {
        expect(launchTarget(cfg, 0, rng)).toBe(cfg.tank[0])
        for (let r = 0; r < cfg.rounds; r++) {
          const t = launchTarget(cfg, r, rng)
          expect(t).toBeGreaterThanOrEqual(cfg.tank[0])
          expect(t).toBeLessThanOrEqual(cfg.tank[1])
        }
      }
    })

    it(`${band}: a tank can always be filled exactly, whatever the child pops on the way`, () => {
      const rng = seeded(band.charCodeAt(0))
      for (let game = 0; game < 300; game++) {
        const target = launchTarget(cfg, game % cfg.rounds, rng)
        let level = 0
        let bubbles = launchBubbles(cfg, target, rng)
        expect(bubbles).toHaveLength(cfg.bubbles)
        for (let pops = 0; level < target; pops++) {
          expect(pops).toBeLessThanOrEqual(target)
          const gap = target - level
          const fits = bubbles.map((v, i) => ({ v, i })).filter((b) => b.v <= gap)
          // Never stuck…
          expect(fits.length).toBeGreaterThan(0)
          // …and when one bubble could finish the job, it is on screen.
          if (cfg.sizes.includes(gap)) expect(bubbles).toContain(gap)
          const pick = fits[Math.floor(rng() * fits.length)]
          level += pick.v
          if (level < target) {
            const others = bubbles.filter((_, i) => i !== pick.i)
            const fresh = launchRefill(cfg, others, target - level, rng)
            expect(cfg.sizes).toContain(fresh)
            bubbles = bubbles.map((v, i) => (i === pick.i ? fresh : v))
          }
        }
        expect(level).toBe(target)
      }
    })

    it(`${band}: there is something to think about, not only right answers`, () => {
      const rng = seeded(99)
      let traps = 0
      for (let i = 0; i < 100; i++) if (launchBubbles(cfg, cfg.tank[0], rng).some((v) => v > cfg.tank[0])) traps++
      // The smallest tank of the youngest holds every bubble; everywhere else some would spill.
      if (Math.max(...cfg.sizes) > cfg.tank[0]) expect(traps).toBe(100)
    })
  }
})
