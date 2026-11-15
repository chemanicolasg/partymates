import { describe, expect, it } from 'vitest'
import { DOJO, DOJO_START, getLevel } from '../src/core/curriculum'
import { factLabel, fmtNum, fmtQty } from '../src/core/format'
import {
  factPool,
  fuse,
  genArenaRound,
  genBayRound,
  genBlocksRound,
  genDojoSheet,
  genPartyRound,
  makeFact,
  minPieces,
  moveFor,
  partyStart,
} from '../src/core/generators'
import { midi, parseTrack, TRACKS, type TrackId } from '../src/core/music'
import { dojoPassed, rewardsFor, starsFor, weekStart } from '../src/core/scoring'
import { INTERVALS, isDue, memoryStats, review } from '../src/core/srs'
import { BANDS, LEVELS_PER_WORLD, WORLDS } from '../src/core/types'

/** Deterministic random numbers so failures can be reproduced. */
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const everyLevel = () =>
  WORLDS.flatMap((w) => BANDS.flatMap((b) => Array.from({ length: LEVELS_PER_WORLD }, (_, i) => ({ w, b, i }))))

describe('curriculum', () => {
  it('defines 8 levels for every world and age band', () => {
    for (const { w, b, i } of everyLevel()) expect(getLevel(w, b, i), `${w}-${b}-${i}`).toBeDefined()
  })

  it('every fact pool has enough different facts', () => {
    for (const step of DOJO) for (const spec of step.specs) expect(factPool(spec).length, step.id).toBeGreaterThanOrEqual(7)
    for (const band of BANDS) expect(DOJO[DOJO_START[band]]).toBeDefined()
  })
})

describe('generators produce solvable rounds on every level', () => {
  for (const { w, b, i } of everyLevel()) {
    it(`${w}-${b}-${i}`, () => {
      const cfg = getLevel(w, b, i)
      const rnd = seeded(i * 97 + b.charCodeAt(0) * 13 + w.length)
      for (let n = 0; n < 150; n++) {
        if (cfg.kind === 'blocks') {
          const r = genBlocksRound(cfg, rnd)
          expect(r.target).toBeGreaterThanOrEqual(cfg.min)
          expect(r.target).toBeLessThanOrEqual(cfg.max)
          expect(r.target % cfg.step).toBe(0)
          expect(r.start).toBeGreaterThanOrEqual(0)
          expect(r.start).toBeLessThan(r.target)
          if (!cfg.partial) expect(r.start).toBe(0)
          // The missing part can always be built with the pieces on offer, in a reasonable number of taps.
          const pieces = minPieces(r.target - r.start, cfg.pieces)
          expect(pieces).toBeGreaterThan(0)
          expect(pieces).toBeLessThanOrEqual(40)
        } else if (cfg.kind === 'party') {
          let pos = partyStart(cfg, rnd)
          for (let t = 0; t < cfg.rounds; t++) {
            const r = genPartyRound(cfg, pos, rnd)
            expect(r.dest).toBe(r.pos + moveFor(r.rule, r.dice))
            expect(r.dest).toBeGreaterThanOrEqual(cfg.min)
            expect(r.dest).toBeLessThanOrEqual(cfg.max)
            expect(r.dest).not.toBe(r.pos)
            if (r.options) {
              expect(r.options).toContain(r.dest)
              expect(new Set(r.options).size).toBe(r.options.length)
              expect(r.options.length).toBe(6)
              expect(r.options).not.toContain(r.pos)
            } else {
              expect(cfg.max - cfg.min).toBeLessThanOrEqual(30)
            }
            pos = r.dest
          }
        } else if (cfg.kind === 'arena') {
          const r = genArenaRound(cfg, undefined, rnd)
          expect(r.cards.length).toBe(cfg.hand)
          expect(r.target).toBeGreaterThanOrEqual(0)
          // At least one pair of cards hits the shield exactly.
          let solvable = false
          for (let x = 0; x < r.cards.length; x++)
            for (let y = x + 1; y < r.cards.length; y++) if (fuse(r.op, r.cards[x], r.cards[y]) === r.target) solvable = true
          expect(solvable, JSON.stringify(r)).toBe(true)
        } else {
          const r = genBayRound(cfg, rnd)
          expect(Number.isInteger(r.answer)).toBe(true)
          expect(r.answer).toBeGreaterThan(0)
          if (r.t === 'share') {
            expect(r.k * r.answer + (r.answer2 ?? 0)).toBe(r.total)
            expect(r.answer2 ?? 0).toBeLessThan(r.k)
            if (r.concrete) expect(r.total).toBeLessThanOrEqual(30)
          }
          if (r.t === 'groups') expect(r.k * r.answer).toBe(r.total)
          if (r.t === 'frac') expect((r.total * r.n) / r.d).toBe(r.answer)
          if (r.t === 'pct') expect((r.total * r.pct) / 100).toBe(r.answer)
          if (r.t === 'ratio') {
            expect(r.answer + r.answer2!).toBe(r.total)
            expect(r.answer * r.d).toBe(r.answer2! * r.n)
          }
        }
      }
    })
  }
})

describe('facts', () => {
  it('builds facts with stable keys', () => {
    expect(makeFact('add', 7, 3)).toMatchObject({ answer: 10, key: '3+7' })
    expect(makeFact('mul', 7, 6)).toMatchObject({ answer: 42, key: '6x7' })
    expect(makeFact('sub', 12, 5)).toMatchObject({ answer: 7, key: '12-5' })
    expect(makeFact('div', 6, 7)).toMatchObject({ a: 42, b: 6, answer: 7, key: '42/6' })
    expect(makeFact('mul', 0.1, 3).answer).toBe(0.3)
  })

  it('fuses cards in any order', () => {
    expect(fuse('sub', 4, 9)).toBe(5)
    expect(fuse('div', 6, 42)).toBe(7)
    expect(fuse('div', 5, 42)).toBeNaN()
    expect(fuse('mul', 2.5, 4)).toBe(10)
  })

  it('finds the fewest pieces', () => {
    expect(minPieces(47, [10, 1])).toBe(11)
    expect(minPieces(8, [12, 6, 4, 3, 1])).toBe(2)
    expect(minPieces(40, [50, 25, 10, 5, 1])).toBe(3)
  })

  it('daily sheets have 12 facts and avoid repeats when the pool allows', () => {
    const rnd = seeded(5)
    for (const step of DOJO) {
      const sheet = genDojoSheet(step, undefined, rnd)
      expect(sheet.length).toBe(12)
      const distinct = new Set(sheet.map((f) => f.key)).size
      expect(distinct).toBeGreaterThanOrEqual(Math.min(12, new Set(step.specs.flatMap((s) => factPool(s).map((f) => f.key))).size))
    }
  })
})

describe('spaced repetition', () => {
  it('moves facts up on success and back to the start on a slip', () => {
    const t0 = 1_000_000
    let m = review({}, [{ key: '6x7', correct: true, ms: 900 }], t0)
    expect(m['6x7'].box).toBe(1)
    expect(m['6x7'].due).toBe(t0 + INTERVALS[1])
    expect(isDue(m['6x7'], t0)).toBe(false)
    expect(isDue(m['6x7'], t0 + INTERVALS[1])).toBe(true)
    m = review(m, [{ key: '6x7', correct: false, ms: 900 }], t0)
    expect(m['6x7']).toMatchObject({ box: 0, ok: 1, ko: 1 })
    expect(isDue(m['6x7'], t0)).toBe(true)
    expect(memoryStats(m, t0).weak).toEqual(['6x7'])
  })

  it('brings due facts back into play', () => {
    const cfg = getLevel('arena', 'C', 3)
    if (cfg.kind !== 'arena') throw new Error('expected arena')
    const memory = review({}, [{ key: '7x8', correct: false, ms: 0 }], 0)
    const rnd = seeded(11)
    let hits = 0
    for (let i = 0; i < 300; i++) if (genArenaRound(cfg, memory, rnd).fact.key === '7x8') hits++
    // 7×8 is 2 of 64 facts by chance (~9 in 300); review must make it clearly more frequent.
    expect(hits).toBeGreaterThan(60)
  })
})

describe('scoring', () => {
  it('awards stars for first-try accuracy', () => {
    expect(starsFor(6, 6)).toBe(3)
    expect(starsFor(7, 8)).toBe(3)
    expect(starsFor(5, 6)).toBe(2)
    expect(starsFor(3, 6)).toBe(1)
    expect(starsFor(2, 6)).toBe(0)
    expect(starsFor(0, 0)).toBe(0)
  })

  it('pays a bonus only for new stars', () => {
    const result = { correct: 6, total: 6, ms: 1000, facts: [] }
    expect(rewardsFor(result, 0).coins).toBeGreaterThan(rewardsFor(result, 3).coins)
    expect(rewardsFor(result, 3)).toMatchObject({ stars: 3, xp: 120 })
  })

  it('needs accuracy and speed to master a daily sheet', () => {
    expect(dojoPassed(12, 12, 40, 50)).toBe(true)
    expect(dojoPassed(11, 12, 50, 50)).toBe(true)
    expect(dojoPassed(10, 12, 30, 50)).toBe(false)
    expect(dojoPassed(12, 12, 51, 50)).toBe(false)
  })

  it('weeks start on Monday', () => {
    expect(weekStart(new Date(2026, 10, 15, 10).getTime())).toBe('2026-11-09') // a Sunday
    expect(weekStart(new Date(2026, 10, 16, 10).getTime())).toBe('2026-11-16') // a Monday
  })
})

describe('music', () => {
  it('reads note names', () => {
    expect(midi('A4')).toBe(69)
    expect(midi('C4')).toBe(60)
    expect(midi('Bb4')).toBe(70)
    expect(midi('G#5')).toBe(80)
  })

  it('every loop is well formed and stays in a comfortable range', () => {
    for (const id of Object.keys(TRACKS) as TrackId[]) {
      const track = parseTrack(TRACKS[id])
      expect(track.steps, id).toBe(TRACKS[id].chords.length * 8)
      expect(TRACKS[id].drums?.length ?? 8, id).toBe(8)
      expect(TRACKS[id].arp?.length ?? 8, id).toBe(8)
      const notes = track.notes.filter((n) => n !== null)
      expect(notes.length, id).toBeGreaterThan(8)
      // Between C4 and C7: clear on small tablet speakers, never shrill.
      for (const n of notes) {
        expect(n.midi, id).toBeGreaterThanOrEqual(60)
        expect(n.midi, id).toBeLessThanOrEqual(96)
        expect(n.len, id).toBeGreaterThanOrEqual(1)
      }
      for (const chord of track.chords) {
        expect(chord.root, id).toBeGreaterThanOrEqual(36)
        expect(chord.root, id).toBeLessThan(48)
      }
    }
  })

  it('melodies only use notes of their key (no accidental wrong notes)', () => {
    // Pitch classes of each loop's scale; the arena adds G# for its E major turnaround.
    const scales: Record<TrackId, number[]> = {
      hub: [0, 2, 4, 5, 7, 9, 11],
      blocks: [7, 9, 11, 2, 4],
      party: [5, 7, 9, 10, 0, 2, 4],
      arena: [9, 11, 0, 2, 4, 5, 7, 8],
      bay: [2, 4, 6, 7, 9, 11, 1],
      dojo: [4, 7, 9, 11, 2],
    }
    for (const id of Object.keys(TRACKS) as TrackId[])
      for (const n of parseTrack(TRACKS[id]).notes) if (n) expect(scales[id], `${id} ${n.midi}`).toContain(n.midi % 12)
  })

  it('rejects malformed bars', () => {
    expect(() => parseTrack({ ...TRACKS.dojo, melody: 'E5 - - G5' })).toThrow()
    expect(() => parseTrack({ ...TRACKS.dojo, chords: ['Em'] })).toThrow()
  })
})

describe('formatting', () => {
  it('uses the decimal comma in Catalan and Spanish', () => {
    expect(fmtNum(2.5, 'ca')).toBe('2,5')
    expect(fmtNum(2.5, 'en')).toBe('2.5')
    expect(fmtNum(-4, 'es')).toBe('−4')
    expect(fmtQty(235, 'dec', 100, 'es')).toBe('2,35')
    expect(fmtQty(30, 'dec', 10, 'en')).toBe('3.0')
  })

  it('writes fractions in lowest terms', () => {
    expect(fmtQty(6, 'frac', 8, 'ca')).toBe('3/4')
    expect(fmtQty(11, 'frac', 8, 'ca')).toBe('1 3/8')
    expect(fmtQty(16, 'frac', 8, 'ca')).toBe('2')
    expect(fmtQty(65, 'pct', 1, 'en')).toBe('65 %')
  })

  it('labels facts for the grown-ups report', () => {
    expect(factLabel('6x7', 'ca')).toBe('6 × 7 = 42')
    expect(factLabel('42/6', 'ca')).toBe('42 ÷ 6 = 7')
    expect(factLabel('12-5', 'en')).toBe('12 − 5 = 7')
    expect(factLabel('0.5x4', 'es')).toBe('0,5 × 4 = 2')
  })
})
