/** Tiny synthesised sound effects: no audio files to download, works offline. */
let ctx: AudioContext | null = null
let enabled = true

export const setSoundEnabled = (on: boolean) => {
  enabled = on
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'triangle', gain = 0.12) {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  const t0 = ctx.currentTime + start
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

const SOUNDS = {
  tap: () => tone(520, 0, 0.07, 'square', 0.05),
  add: () => tone(660, 0, 0.08),
  remove: () => tone(330, 0, 0.08),
  good: () => [523, 659, 784].forEach((f, i) => tone(f, i * 0.08, 0.16)),
  bad: () => [220, 185].forEach((f, i) => tone(f, i * 0.12, 0.2, 'sawtooth', 0.06)),
  roll: () => [300, 380, 340, 420, 360].forEach((f, i) => tone(f, i * 0.06, 0.06, 'square', 0.05)),
  coin: () => [988, 1319].forEach((f, i) => tone(f, i * 0.07, 0.14, 'square', 0.06)),
  star: () => [784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.22)),
  win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.24)),
  zap: () => [900, 600, 300].forEach((f, i) => tone(f, i * 0.04, 0.09, 'sawtooth', 0.07)),
}

export type Sound = keyof typeof SOUNDS

export function sfx(name: Sound) {
  if (!enabled || typeof window === 'undefined') return
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    ctx ??= new Ctor()
    if (ctx.state === 'suspended') void ctx.resume()
    SOUNDS[name]()
  } catch {
    /* sound is a nice-to-have */
  }
}
