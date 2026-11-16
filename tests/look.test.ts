import { describe, expect, it } from 'vitest'
import { BROWS, CHEEKS, decodeLook, DEFAULT_LOOK, encodeLook, EYE_COLORS, EYES, FACE_PARTS, FACES, HAIR_COLORS, HAIR_STYLES, ITEMS, MOUTHS, NOSES, randomKid, SKIN_TONES, type Look } from '../src/core/look'
import { upgradeProfile } from '../src/core/store'

describe('faces', () => {
  it('survive the trip to the class and back', () => {
    const look: Look = { ...DEFAULT_LOOK, tone: 4, hair: 'braids', hairColor: 5, face: 'heart', eyes: 'lash', eyeColor: 2, brows: 'keen', nose: 'button', mouth: 'gap', cheeks: 'both', hat: 'pirate', glasses: 'round' }
    expect(decodeLook(encodeLook(look))).toEqual(look)
    expect(encodeLook(look).length).toBeLessThanOrEqual(200)
  })

  it('read looks saved before faces had features', () => {
    const old = 'kid|2|long|1|pirate|patch|pirate|🦜|ocean'
    expect(decodeLook(old)).toEqual({ ...DEFAULT_LOOK, tone: 2, hair: 'long', hairColor: 1, hat: 'pirate', glasses: 'patch', outfit: 'pirate', pet: '🦜', bg: 'ocean' })
    expect(decodeLook('kid|2|long|1|||tee-red||sky|triangle|laser|9|x|y|z|w').face).toBe('round')
  })

  it('give a saved player whatever their look lacks', () => {
    const { face: _f, eyes: _e, mouth: _m, ...before } = { ...DEFAULT_LOOK, hair: 'curly', tone: 3 }
    const p = upgradeProfile({ id: 'p', name: 'x', band: 'B', look: before, owned: [], coins: 0, levels: {}, stats: {}, classNum: null })
    expect(p.look).toEqual({ ...DEFAULT_LOOK, hair: 'curly', tone: 3 })
  })

  it('can be rolled at random, always from the options on offer', () => {
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
    const seen = new Set<string>()
    for (let n = 0; n < 300; n++) {
      const k = randomKid(rnd)
      expect(FACES).toContain(k.face)
      expect(HAIR_STYLES).toContain(k.hair)
      expect(EYES).toContain(k.eyes)
      expect(BROWS).toContain(k.brows)
      expect(NOSES).toContain(k.nose)
      expect(MOUTHS).toContain(k.mouth)
      expect(CHEEKS).toContain(k.cheeks)
      expect(k.tone).toBeLessThan(SKIN_TONES.length)
      expect(k.hairColor).toBeLessThan(HAIR_COLORS.length)
      expect(k.eyeColor).toBeLessThan(EYE_COLORS.length)
      seen.add(JSON.stringify(k))
    }
    expect(seen.size).toBeGreaterThan(290)
    // Thousands of different faces from free parts alone.
    const combos = Object.values(FACE_PARTS).reduce((n, options) => n * options.length, SKIN_TONES.length * HAIR_COLORS.length * EYE_COLORS.length)
    expect(combos).toBeGreaterThan(1_000_000)
  })

  it('hands out a present with the very first star', () => {
    const firsts = ITEMS.filter((i) => i.stars !== undefined).sort((a, b) => (a.stars as number) - (b.stars as number))
    expect(firsts[0].stars).toBe(1)
  })
})
