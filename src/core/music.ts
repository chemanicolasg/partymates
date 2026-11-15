import { audioContext } from './audio'

/**
 * Background music, composed here as short loops and played by a tiny synthesiser:
 * no audio files, so it works offline, weighs nothing and has no licensing strings attached.
 */
export type TrackId = 'hub' | 'blocks' | 'party' | 'arena' | 'bay' | 'dojo'

export interface TrackSpec {
  bpm: number
  wave: OscillatorType
  /** Bars separated by "|", eight eighth-notes per bar: a note (E5, Bb4), "-" to hold it, "." for silence. */
  melody: string
  /** One chord per bar: a root with an optional "m" for minor (C, Am, Bb). */
  chords: string[]
  bass: 'walk' | 'drive' | 'sync' | 'pad'
  /** Chord tone (0 root, 1 third, 2 fifth, 3 octave) on each eighth, -1 for none. */
  arp?: number[]
  /** One character per eighth: k kick, s snare, h hi-hat, "." nothing. */
  drums?: string
}

export const TRACKS: Record<TrackId, TrackSpec> = {
  // Sunny and unhurried: the map between adventures.
  hub: {
    bpm: 96,
    wave: 'triangle',
    melody:
      'E5 - G5 - C6 - G5 - | A5 - G5 E5 G5 - - - | F5 - A5 - C6 - A5 - | G5 - E5 D5 C5 - - - | ' +
      'E5 - G5 - C6 - E6 - | D6 - C6 A5 G5 - - - | F5 - A5 - D6 - C6 - | B5 - G5 - D5 - - -',
    chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'G'],
    bass: 'walk',
    arp: [-1, 2, -1, 1, -1, 2, -1, 1],
    drums: 'k.h.k.h.',
  },
  // Calm pentatonic wandering for building.
  blocks: {
    bpm: 84,
    wave: 'sine',
    melody:
      'B4 - D5 - G5 - - - | E5 - D5 - B4 - - - | A4 - B4 - D5 - E5 - | D5 - - - - - - - | ' +
      'G5 - E5 - D5 - B4 - | A4 - B4 - D5 - - - | E5 - D5 - B4 - A4 - | G4 - - - - - - -',
    chords: ['G', 'Em', 'C', 'D', 'G', 'Em', 'C', 'G'],
    bass: 'pad',
    arp: [0, 2, 1, 2, 3, 2, 1, 2],
  },
  // Bouncy fairground tune for the dice race.
  party: {
    bpm: 126,
    wave: 'square',
    melody:
      'F5 A5 C6 A5 F5 A5 C6 - | D6 C6 A5 C6 A5 - F5 - | G5 Bb5 D6 Bb5 G5 Bb5 D6 - | C6 Bb5 A5 G5 E5 - C5 - | ' +
      'A5 C6 F6 C6 A5 C6 F6 - | E6 D6 C6 A5 C6 - A5 - | Bb5 D6 F6 D6 Bb5 A5 G5 - | A5 G5 F5 E5 F5 - - -',
    chords: ['F', 'Dm', 'Gm', 'C', 'F', 'Dm', 'Bb', 'C'],
    bass: 'sync',
    drums: 'k.hsk.hs',
  },
  // Driving minor riff: the storm is coming.
  arena: {
    bpm: 138,
    wave: 'sawtooth',
    melody:
      'A4 - A4 C5 E5 - D5 C5 | A4 - A4 C5 E5 - G5 E5 | F4 - F4 A4 C5 - B4 A4 | G4 - G4 B4 D5 - E5 D5 | ' +
      'A4 - A4 C5 E5 - D5 C5 | A5 - G5 E5 D5 - C5 D5 | F5 - E5 C5 A4 - C5 A4 | E5 - E5 G#5 B5 - G#5 E5',
    chords: ['Am', 'Am', 'F', 'G', 'Am', 'Am', 'F', 'E'],
    bass: 'drive',
    drums: 'k.hskkhs',
  },
  // Lilting island rhythm for sharing treasure.
  bay: {
    bpm: 108,
    wave: 'triangle',
    melody:
      'D5 - F#5 A5 - F#5 A5 - | B5 - A5 F#5 - D5 - - | G5 - B5 D6 - B5 G5 - | A5 - E5 C#5 - E5 - - | ' +
      'D5 - F#5 A5 - D6 A5 - | B5 - D6 B5 - A5 - - | G5 - F#5 E5 - G5 F#5 E5 | D5 - - - - - - -',
    chords: ['D', 'Bm', 'G', 'A', 'D', 'Bm', 'A', 'D'],
    bass: 'sync',
    arp: [-1, 1, 2, -1, 1, 2, -1, 2],
    drums: 'k.hh.kh.',
  },
  // Sparse and steady: keeps the pace of a speed sheet without getting in the way.
  dojo: {
    bpm: 112,
    wave: 'triangle',
    melody: 'E5 - - G5 - - A5 - | B5 - - A5 - - G5 - | E5 - - G5 - - B5 - | A5 - - - - - - -',
    chords: ['Em', 'G', 'C', 'D'],
    bass: 'walk',
    drums: 'khhhkhhh',
  },
}

// ───────────── Parsing ─────────────

const SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/** "A4" → 69 (MIDI note number). */
export function midi(note: string): number {
  const m = note.match(/^([A-G])([#b]?)(\d)$/)
  if (!m) throw new Error(`Bad note: ${note}`)
  return SEMITONES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12 * (Number(m[3]) + 1)
}

const hz = (n: number) => 440 * 2 ** ((n - 69) / 12)

interface Chord {
  /** Root between C2 and B2, for the bass. */
  root: number
  third: number
}

export interface Track {
  spec: TrackSpec
  /** One entry per eighth-note: the note that starts there and how many eighths it lasts. */
  notes: ({ midi: number; len: number } | null)[]
  chords: Chord[]
  steps: number
}

export function parseTrack(spec: TrackSpec): Track {
  const bars = spec.melody.split('|').map((b) => b.trim().split(/\s+/))
  if (bars.length !== spec.chords.length) throw new Error('One chord per bar, please')
  const tokens = bars.flatMap((bar) => {
    if (bar.length !== 8) throw new Error(`A bar needs 8 eighth-notes, got ${bar.length}: ${bar.join(' ')}`)
    return bar
  })
  const notes: Track['notes'] = tokens.map((tok, i) => {
    if (tok === '-' || tok === '.') return null
    let len = 1
    while (tokens[i + len] === '-') len++
    return { midi: midi(tok), len }
  })
  const chords = spec.chords.map((name) => {
    const m = name.match(/^([A-G][#b]?)(m?)$/)
    if (!m) throw new Error(`Bad chord: ${name}`)
    return { root: 36 + (midi(`${m[1]}2`) % 12), third: m[2] ? 3 : 4 }
  })
  return { spec, notes, chords, steps: tokens.length }
}

const parsed = new Map<TrackId, Track>()
const track = (id: TrackId): Track => {
  let t = parsed.get(id)
  if (!t) parsed.set(id, (t = parseTrack(TRACKS[id])))
  return t
}

// ───────────── Synthesiser ─────────────

/** Square and saw waves carry far more energy than a triangle at the same level. */
const LEAD_GAIN: Record<string, number> = { sine: 0.085, triangle: 0.075, square: 0.032, sawtooth: 0.03 }

function voice(ctx: BaseAudioContext, out: AudioNode, wave: OscillatorType, freq: number, t: number, dur: number, gain: number) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = wave
  osc.frequency.value = freq
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012)
  g.gain.exponentialRampToValueAtTime(gain * 0.4, t + dur * 0.7)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.06)
  osc.connect(g).connect(out)
  osc.start(t)
  osc.stop(t + dur + 0.1)
}

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>()
function noise(ctx: BaseAudioContext): AudioBuffer {
  let buffer = noiseBuffers.get(ctx)
  if (!buffer) {
    buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    noiseBuffers.set(ctx, buffer)
  }
  return buffer
}

function drum(ctx: BaseAudioContext, out: AudioNode, kind: string, t: number) {
  if (kind === 'k') {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.frequency.setValueAtTime(130, t)
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.11)
    g.gain.setValueAtTime(0.16, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
    osc.connect(g).connect(out)
    osc.start(t)
    osc.stop(t + 0.18)
  } else if (kind === 's' || kind === 'h') {
    const src = ctx.createBufferSource()
    const filter = ctx.createBiquadFilter()
    const g = ctx.createGain()
    const len = kind === 's' ? 0.11 : 0.035
    src.buffer = noise(ctx)
    filter.type = 'highpass'
    filter.frequency.value = kind === 's' ? 1800 : 7000
    g.gain.setValueAtTime(kind === 's' ? 0.05 : 0.022, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + len)
    src.connect(filter).connect(g).connect(out)
    src.start(t)
    src.stop(t + len + 0.02)
  }
}

/** Schedules everything that starts on one eighth-note of the loop. */
export function scheduleStep(ctx: BaseAudioContext, out: AudioNode, tr: Track, step: number, t: number, stepDur: number) {
  const { spec } = tr
  const pos = step % 8
  const chord = tr.chords[Math.floor(step / 8)]
  const fifth = chord.root + 7

  const note = tr.notes[step]
  if (note) voice(ctx, out, spec.wave, hz(note.midi), t, Math.min(note.len, 4) * stepDur * 0.95, LEAD_GAIN[spec.wave] ?? 0.05)

  const bass = (n: number, len: number) => voice(ctx, out, 'triangle', hz(n), t, len * stepDur * 0.9, 0.1)
  if (spec.bass === 'walk') {
    if (pos === 0) bass(chord.root, 3)
    if (pos === 4) bass(fifth, 2)
  } else if (spec.bass === 'drive') {
    bass(pos === 7 ? chord.root + 12 : chord.root, 0.8)
  } else if (spec.bass === 'sync') {
    if (pos === 0 || pos === 3) bass(chord.root, 1.5)
    if (pos === 6) bass(fifth, 1.5)
  } else if (pos === 0) {
    bass(chord.root, 7)
  }

  const tone = spec.arp?.[pos] ?? -1
  if (tone >= 0) {
    const n = chord.root + 24 + [0, chord.third, 7, 12][tone]
    voice(ctx, out, 'sine', hz(n), t, stepDur * 1.6, 0.03)
  }

  if (spec.drums) drum(ctx, out, spec.drums[pos], t)
}

// ───────────── Player ─────────────

const VOLUME = 0.6
const LOOKAHEAD = 0.25

let enabled = true
let wanted: TrackId | null = null
let playing: TrackId | null = null
let unlocked = false
let tempo = 1
let timer: number | undefined
let bus: GainNode | null = null
let step = 0
let nextTime = 0

function stop() {
  clearInterval(timer)
  timer = undefined
  playing = null
  const ctx = audioContext()
  if (ctx && bus) {
    // Fade out whatever is already scheduled, then drop the old chain.
    const old = bus
    old.gain.setTargetAtTime(0, ctx.currentTime, 0.07)
    window.setTimeout(() => old.disconnect(), 900)
  }
  bus = null
}

function tick() {
  const ctx = audioContext()
  if (!ctx || !bus || !playing) return
  const tr = track(playing)
  const stepDur = 60 / tr.spec.bpm / 2 / tempo
  // After a stall (throttled tab, busy device) pick the beat up from now instead of rushing to catch up.
  if (nextTime < ctx.currentTime - 0.05) nextTime = ctx.currentTime + 0.05
  while (nextTime < ctx.currentTime + LOOKAHEAD) {
    scheduleStep(ctx, bus, tr, step, nextTime, stepDur)
    nextTime += stepDur
    step = (step + 1) % tr.steps
  }
}

/** Brings the player in line with what should be heard right now. */
function sync() {
  if (typeof window === 'undefined') return
  const should = enabled && wanted !== null && unlocked && !document.hidden
  if (!should) return stop()
  const ctx = audioContext()
  if (!ctx) return
  if (ctx.state !== 'running') {
    void ctx
      .resume()
      .then(() => ctx.state === 'running' && sync())
      .catch(() => {})
    return
  }
  if (playing === wanted && timer !== undefined) return
  stop()
  playing = wanted
  step = 0
  nextTime = ctx.currentTime + 0.3
  // A gentle low-pass takes the edge off the square and saw leads.
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 3200
  bus = ctx.createGain()
  bus.gain.setValueAtTime(0, ctx.currentTime)
  bus.gain.setTargetAtTime(VOLUME, ctx.currentTime + 0.2, 0.12)
  bus.connect(filter).connect(ctx.destination)
  timer = window.setInterval(tick, 60)
  tick()
}

/** Chooses the loop for the current screen; null means silence. */
export function playMusic(id: TrackId | null) {
  wanted = id
  sync()
}

export function setMusicEnabled(on: boolean) {
  enabled = on
  sync()
}

/** Speeds the loop up or down (1 = written tempo); used when the storm closes in. */
export function setMusicTempo(multiplier: number) {
  tempo = multiplier
}

if (typeof window !== 'undefined') {
  // Browsers only allow sound after the player touches the page.
  const unlock = () => {
    unlocked = true
    sync()
  }
  window.addEventListener('pointerdown', unlock, { capture: true })
  window.addEventListener('keydown', unlock, { capture: true })
  // Never keep playing from a background tab or a locked tablet.
  document.addEventListener('visibilitychange', sync)

  if (import.meta.env?.DEV) {
    // Development aid: renders one pass of a loop off-line so its loudness can be measured in tests.
    ;(window as unknown as Record<string, unknown>).__pmRenderTrack = async (id: TrackId, loops = 1) => {
      const tr = track(id)
      const stepDur = 60 / tr.spec.bpm / 2
      const rate = 22050
      const total = tr.steps * loops
      const offline = new OfflineAudioContext(1, Math.ceil(rate * (total * stepDur + 0.5)), rate)
      const filter = offline.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 3200
      const out = offline.createGain()
      out.gain.value = VOLUME
      out.connect(filter).connect(offline.destination)
      for (let s = 0; s < total; s++) scheduleStep(offline, out, tr, s % tr.steps, 0.05 + s * stepDur, stepDur)
      const data = (await offline.startRendering()).getChannelData(0)
      let peak = 0
      let sum = 0
      for (const v of data) {
        peak = Math.max(peak, Math.abs(v))
        sum += v * v
      }
      return { rate, seconds: data.length / rate, peak, rms: Math.sqrt(sum / data.length), samples: Array.from(data, (v) => Math.round(v * 32767)) }
    }
  }
}
