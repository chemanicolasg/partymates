import { describe, expect, it } from 'vitest'
import { ITEM_BY_ID } from '../src/core/look'
import { currentSeason, seasonEnd, seasonOn, SEASONS, seasonWorld, seasonYear } from '../src/core/seasons'
import { TOPIC_BY_ID } from '../src/core/topics'
import { BANDS } from '../src/core/types'
import {
  answerValue,
  areaStops,
  cleanWorld,
  evalExpr,
  exercisesText,
  isRight,
  isTyped,
  MAX_STOPS,
  optionsFor,
  parseExercises,
  stopProblem,
  TEMPLATE_AREAS,
  type QA,
} from '../src/core/worlds'

const items = (text: string) => parseExercises(text).map((l) => l.item ?? l.error)

describe('what a teacher types', () => {
  it('works out plain operations, however the signs are written', () => {
    expect(items('23 + 48\n7x8\n7 * 8\n12 : 4\n12/4\n100 − 45\n2,5 + 1,5\n(3 + 4) × 2\n3 + 4 × 2')).toEqual([
      ['23 + 48', '71'],
      ['7 × 8', '56'],
      ['7 × 8', '56'],
      ['12 ÷ 4', '3'],
      ['12 ÷ 4', '3'],
      ['100 − 45', '55'],
      ['2,5 + 1,5', '4'],
      ['(3 + 4) × 2', '14'],
      ['3 + 4 × 2', '11'],
    ])
  })

  it('accepts a trailing "=" or "= ?" and list numbering', () => {
    expect(items('1. 23 + 48 =\n2) 9 - 4 = ?\n- 6 x 6')).toEqual([
      ['23 + 48', '71'],
      ['9 − 4', '5'],
      ['6 × 6', '36'],
    ])
  })

  it('finds the missing number', () => {
    expect(items('3 x ? = 12\n? + 7 = 15\n20 - _ = 8\n12 : ? = 3\n□ : 4 = 5')).toEqual([
      ['3 × ? = 12', '4'],
      ['? + 7 = 15', '8'],
      ['20 − ? = 8', '12'],
      ['12 ÷ ? = 3', '4'],
      ['? ÷ 4 = 5', '20'],
    ])
  })

  it('keeps a written answer only when it is right', () => {
    expect(items('7 x 8 = 56\n7 x 8 = 54')).toEqual([['7 × 8', '56'], 'answer'])
  })

  it('takes any question with its answer after the last "="', () => {
    expect(items('Lados de un hexágono = 6\nPolígono de 3 lados = triángulo\nMitad de 9 = 4,5')).toEqual([
      ['Lados de un hexágono', '6'],
      ['Polígono de 3 lados', 'triángulo'],
      ['Mitad de 9', '4,5'],
    ])
  })

  it('flags what it cannot use instead of guessing', () => {
    expect(items('hola\n10 : 3\n5 : 0\nPregunta sin respuesta =\n3 + = 4')).toEqual(['syntax', 'inexact', 'syntax', 'answer', 'syntax'])
    expect(items(`${'a'.repeat(80)} = 3`)).toEqual(['long'])
  })

  it('never runs what is typed as code', () => {
    expect(evalExpr('alert(1)')).toBeNull()
    expect(evalExpr('2**3')).toBeNull()
    expect(evalExpr('1e3')).toBeNull()
    expect(evalExpr('')).toBeNull()
    expect(evalExpr('-3 - -2')).toBe(-1)
  })

  it('gives back text that reads to the same exercises', () => {
    const text = '23 + 48\n3 x ? = 12\nLados de un hexágono = 6\n2,5 + 1,5\nPolígono de 3 lados = triángulo'
    const first = parseExercises(text).map((l) => l.item as QA)
    expect(parseExercises(exercisesText(first)).map((l) => l.item)).toEqual(first)
  })
})

describe('answering', () => {
  it('types whole numbers and picks everything else', () => {
    expect(isTyped('71')).toBe(true)
    expect(isTyped('0')).toBe(true)
    expect(isTyped('2,7')).toBe(false)
    expect(isTyped('−4')).toBe(false)
    expect(isTyped('triángulo')).toBe(false)
  })

  it('compares numbers by value and words without minding capitals', () => {
    expect(isRight('71', '071')).toBe(true)
    expect(isRight('2,7', '2.70')).toBe(true)
    expect(isRight('−4', '-4')).toBe(true)
    expect(isRight('71', '17')).toBe(false)
    expect(isRight('triángulo', 'Triángulo ')).toBe(true)
    expect(isRight('triángulo', 'cuadrado')).toBe(false)
    expect(answerValue('pentágono')).toBeNull()
  })

  it('offers three different options with the right one among them', () => {
    const all: QA[] = [
      ['1,5 + 1,2', '2,7'],
      ['3 − 7', '−4'],
      ['Polígono de 3 lados', 'triángulo'],
      ['Polígono de 4 lados', 'cuadrilátero'],
      ['Polígono de 5 lados', 'pentágono'],
    ]
    for (const item of all)
      for (let n = 0; n < 20; n++) {
        const options = optionsFor(item, all)
        expect(options).toHaveLength(3)
        expect(new Set(options).size).toBe(3)
        expect(options.filter((o) => isRight(item[1], o))).toHaveLength(1)
      }
    // A positive answer is never offered next to negative numbers.
    for (let n = 0; n < 20; n++) expect(optionsFor(['0,5 + 0,1', '0,6'], all).every((o) => !o.startsWith('−'))).toBe(true)
  })
})

describe('worlds', () => {
  it('needs enough exercises per stop, and enough different answers when they are words', () => {
    expect(stopProblem({ t: 'own', items: [] })).toBe('empty')
    expect(stopProblem({ t: 'own', items: [['1 + 1', '2'], ['2 + 2', '4']] })).toBe('few')
    expect(stopProblem({ t: 'own', items: [['a', 'sí'], ['b', 'no'], ['c', 'sí']] })).toBe('options')
    expect(stopProblem({ t: 'own', items: [['1 + 1', '2'], ['2 + 2', '4'], ['3 + 3', '6']] })).toBeNull()
    expect(stopProblem({ t: 'topic', topic: 'subBorrow' })).toBeNull()
    expect(stopProblem({ t: 'topic', topic: 'nope' })).toBe('empty')
  })

  it('drops whatever is malformed in a world that came over the network', () => {
    expect(cleanWorld(null)).toBeNull()
    expect(cleanWorld({ id: 'w1', name: 'x', stops: 'no' })).toBeNull()
    expect(cleanWorld({ id: 'w1', name: 'x', scene: 'beach', stops: [{ t: 'topic', topic: 'nope' }] })).toBeNull()
    const w = cleanWorld({
      id: 'w1',
      name: 'Repaso',
      scene: 'volcano',
      stops: [{ t: 'topic', topic: 'subBorrow' }, { t: 'own', items: [['1 + 1', '2'], [3, 4], ['2 + 2', '4'], ['3 + 3', '6']] }, { t: 'other' }, { t: 'own', items: [['solo', '1']] }],
    })
    expect(w?.scene).toBe('beach')
    expect(w?.stops).toEqual([
      { t: 'topic', topic: 'subBorrow' },
      { t: 'own', items: [['1 + 1', '2'], ['2 + 2', '4'], ['3 + 3', '6']] },
    ])
  })

  it('has a ready-made start for every area', () => {
    for (const area of TEMPLATE_AREAS) {
      const stops = areaStops(area)
      expect(stops.length).toBeGreaterThan(0)
      expect(stops.length).toBeLessThanOrEqual(MAX_STOPS)
      for (const s of stops) expect(stopProblem(s)).toBeNull()
    }
  })
})

describe('seasons', () => {
  const day = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12)

  it('follow the calendar, also over New Year', () => {
    expect(seasonOn(day(2026, 10, 31))?.id).toBe('halloween')
    expect(seasonOn(day(2026, 11, 16))).toBeNull()
    expect(seasonOn(day(2026, 12, 24))?.id).toBe('xmas')
    expect(seasonOn(day(2027, 1, 6))?.id).toBe('xmas')
    expect(seasonOn(day(2027, 1, 7))).toBeNull()
    expect(seasonOn(day(2027, 7, 1))).toBeNull()
  })

  it('can be switched off or fixed by the grown-ups', () => {
    expect(currentSeason('off', day(2026, 12, 24))).toBeNull()
    expect(currentSeason('halloween', day(2027, 7, 1))?.id).toBe('halloween')
    expect(currentSeason('auto', day(2026, 12, 24))?.id).toBe('xmas')
  })

  it('keep one edition per year, and January belongs to the Christmas before', () => {
    const xmas = SEASONS.find((s) => s.id === 'xmas')!
    expect(seasonYear(xmas, day(2026, 12, 24))).toBe(2026)
    expect(seasonYear(xmas, day(2027, 1, 3))).toBe(2026)
    expect(seasonWorld(xmas, 'B', day(2027, 1, 3)).id).toBe('xmas-2026')
    expect(seasonEnd(xmas, day(2026, 12, 24))).toBe('2027-01-06')
  })

  it('never overlap, and everything they name exists', () => {
    for (let d = 0; d < 366; d++) {
      const date = new Date(2028, 0, 1 + d, 12)
      const stamp = (date.getMonth() + 1) * 100 + date.getDate()
      const on = SEASONS.filter((s) => {
        const [a, b] = [s.from[0] * 100 + s.from[1], s.to[0] * 100 + s.to[1]]
        return a <= b ? stamp >= a && stamp <= b : stamp >= a || stamp <= b
      })
      expect(on.length).toBeLessThanOrEqual(1)
    }
    for (const s of SEASONS) {
      for (const id of [...s.items, s.prize]) expect(ITEM_BY_ID[id], id).toBeDefined()
      expect(ITEM_BY_ID[s.prize].prize).toBe(true)
      for (const band of BANDS) {
        expect(s.stops[band].length).toBeGreaterThanOrEqual(3)
        for (const topic of s.stops[band]) expect(TOPIC_BY_ID[topic], topic).toBeDefined()
      }
    }
  })
})
