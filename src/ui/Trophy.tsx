import { forwardRef } from 'react'
import type { Look } from '../core/look'
import { CharacterArt } from './Character'
import { MattyArt, Sparkle } from './Matty'

/**
 * The cup a child wins for passing a level, and the square picture built around it for saving or
 * sharing. The picture carries the Matty name and the site address — and nothing about the child:
 * no nickname, no class, only their drawn character.
 */
export type Tier = 'gold' | 'silver' | 'bronze'
export const tierFor = (stars: number): Tier => (stars >= 3 ? 'gold' : stars === 2 ? 'silver' : 'bronze')

const INK = '#23164f'
const METAL: Record<Tier, { main: string; dark: string; light: string }> = {
  gold: { main: '#ffd23f', dark: '#f2a900', light: '#fff3c2' },
  silver: { main: '#dfe5f0', dark: '#aab4c8', light: '#ffffff' },
  bronze: { main: '#f0a868', dark: '#c97a3c', light: '#ffd9b0' },
}
const o = { stroke: INK, strokeWidth: 6, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }

const star = (cx: number, cy: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2
    const k = i % 2 ? r * 0.45 : r
    return `${(cx + Math.cos(a) * k).toFixed(1)},${(cy + Math.sin(a) * k).toFixed(1)}`
  }).join(' ')

/** The cup on a 200×210 canvas. */
export function TrophyArt({ tier }: { tier: Tier }) {
  const m = METAL[tier]
  return (
    <>
      <g fill="none" strokeLinecap="round">
        <path d="M44 50 C6 44 10 106 58 110 M156 50 C194 44 190 106 142 110" stroke={INK} strokeWidth="24" />
        <path d="M44 50 C6 44 10 106 58 110 M156 50 C194 44 190 106 142 110" stroke={m.dark} strokeWidth="12" />
      </g>
      <path d="M88 138 H112 V162 H88Z" fill={m.dark} {...o} />
      <path d="M38 30 H162 V72 C162 118 134 142 100 142 C66 142 38 118 38 72Z" fill={m.main} {...o} />
      <path d="M57 50 V76 C57 96 63 108 72 117" fill="none" stroke={m.light} strokeWidth="9" strokeLinecap="round" opacity=".85" />
      <rect x="30" y="20" width="140" height="18" rx="9" fill={m.light} {...o} />
      <polygon points={star(100, 84, 25)} fill={m.light} {...o} strokeWidth={4.5} />
      <rect x="62" y="158" width="76" height="18" rx="7" fill={m.main} {...o} />
      <rect x="44" y="174" width="112" height="32" rx="9" fill="#5b3fd6" {...o} />
      <rect x="76" y="183" width="48" height="14" rx="5" fill={m.light} stroke={INK} strokeWidth="3" />
    </>
  )
}

export function Trophy({ tier, size = 64 }: { tier: Tier; size?: number }) {
  return (
    <svg className="trophy" viewBox="0 0 200 210" width={size} height={(size * 210) / 200} aria-hidden="true" style={{ flex: 'none' }}>
      <TrophyArt tier={tier} />
    </svg>
  )
}

// ───────────── The picture ─────────────

export const CARD_SIZE = 1080
const FONT = '"Fredoka Variable", "Trebuchet MS", sans-serif'

/** A line of lettering on the picture: drawn as SVG text on screen and on the canvas when saved. */
export interface CardText {
  y: number
  size: number
  parts: { text: string; fill: string }[]
  /** Dark outline around the letters, in pixels. */
  outline?: number
}

export interface CardCopy {
  title: string
  subtitle: string
  tagline: string
  site: string
}

export function cardTexts(copy: CardCopy): CardText[] {
  return [
    { y: 162, size: 150, outline: 16, parts: [{ text: 'Matt', fill: '#ffffff' }, { text: 'y', fill: '#ffd23f' }] },
    { y: 868, size: 84, outline: 12, parts: [{ text: copy.title, fill: '#ffffff' }] },
    { y: 928, size: 42, parts: [{ text: copy.subtitle, fill: '#ffe9a8' }] },
    { y: 1002, size: 34, parts: [{ text: copy.tagline, fill: '#ffffff' }] },
    { y: 1050, size: 38, parts: [{ text: copy.site, fill: '#ffd23f' }] },
  ]
}

/** Scattered sparkles: [x, y, size, colour]. */
const SPARKS: [number, number, number, string][] = [
  [110, 250, 26, '#ffd23f'], [960, 210, 34, '#ffd23f'], [70, 430, 16, '#ff7ab8'], [1010, 420, 20, '#7df9ff'],
  [250, 330, 14, '#7df9ff'], [820, 330, 18, '#ff7ab8'], [930, 820, 16, '#ffd23f'], [150, 860, 18, '#7df9ff'],
]

/** The whole 1080×1080 picture. The ref is what gets turned into a PNG. */
export const TrophyCard = forwardRef<SVGSVGElement, { tier: Tier; stars: number; look: Look; copy: CardCopy }>(function TrophyCard(
  { tier, stars, look, copy },
  ref,
) {
  return (
    <svg ref={ref} className="trophy-card" viewBox={`0 0 ${CARD_SIZE} ${CARD_SIZE}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`Matty · ${copy.title}`}>
      <defs>
        <linearGradient id="cup-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8f6bff" />
          <stop offset="1" stopColor="#3a2499" />
        </linearGradient>
        <radialGradient id="cup-glow" cx="0.5" cy="0.46" r="0.42">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={CARD_SIZE} height={CARD_SIZE} fill="url(#cup-bg)" />
      <rect width={CARD_SIZE} height={CARD_SIZE} fill="url(#cup-glow)" />
      {SPARKS.map(([x, y, size, fill], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${size / 6})`}>
          <Sparkle x={0} y={0} size={6} fill={fill} />
        </g>
      ))}
      <rect y="952" width={CARD_SIZE} height="128" fill={INK} opacity=".38" />

      {[0, 1, 2].map((i) => (
        <polygon key={i} points={star(440 + i * 100, 262, 44)} fill={i < stars ? '#ffd23f' : 'rgba(255,255,255,.25)'} stroke={INK} strokeWidth="8" strokeLinejoin="round" />
      ))}
      <g transform="translate(330 318) scale(2.1)">
        <TrophyArt tier={tier} />
      </g>
      <g transform="translate(42 478) scale(2.75)">
        <MattyArt pose="cheer" />
      </g>
      <circle cx="890" cy="650" r="124" fill="#fffdf7" stroke={INK} strokeWidth="9" />
      <g transform="translate(766 522) scale(2.48)">
        <CharacterArt look={look} />
      </g>

      {cardTexts(copy).map((line, i) => (
        <text
          key={i}
          data-text=""
          x={CARD_SIZE / 2}
          y={line.y}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight="700"
          fontSize={line.size}
          stroke={line.outline ? INK : 'none'}
          strokeWidth={line.outline}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {line.parts.map((p, k) => (
            <tspan key={k} fill={p.fill}>
              {p.text}
            </tspan>
          ))}
        </text>
      ))}
    </svg>
  )
})

/**
 * Turns the picture into a PNG. The artwork is rasterised from the SVG; the lettering is then
 * drawn on the canvas, because an SVG used as an image cannot see the page's web font.
 */
export async function cardToPng(svg: SVGSVGElement, texts: CardText[]): Promise<Blob> {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.querySelectorAll('[data-text]').forEach((n) => n.remove())
  clone.setAttribute('width', String(CARD_SIZE))
  clone.setAttribute('height', String(CARD_SIZE))
  // Colours set through CSS variables fall back to their defaults outside the page.
  const xml = new XMLSerializer().serializeToString(clone).replace(/var\(--[\w-]+,\s*(#[0-9a-fA-F]{3,8})\)/g, '$1')
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Could not draw the picture'))
      img.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = CARD_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No canvas')
    ctx.drawImage(img, 0, 0, CARD_SIZE, CARD_SIZE)
    await document.fonts.load(`700 80px ${FONT}`).catch(() => {})
    ctx.textBaseline = 'alphabetic'
    ctx.lineJoin = 'round'
    for (const line of texts) {
      ctx.font = `700 ${line.size}px ${FONT}`
      const widths = line.parts.map((p) => ctx.measureText(p.text).width)
      let x = (CARD_SIZE - widths.reduce((a, b) => a + b, 0)) / 2
      if (line.outline) {
        ctx.strokeStyle = INK
        ctx.lineWidth = line.outline
        let sx = x
        line.parts.forEach((p, i) => {
          ctx.strokeText(p.text, sx, line.y)
          sx += widths[i]
        })
      }
      line.parts.forEach((p, i) => {
        ctx.fillStyle = p.fill
        ctx.fillText(p.text, x, line.y)
        x += widths[i]
      })
    }
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not save the picture'))), 'image/png'))
  } finally {
    URL.revokeObjectURL(url)
  }
}

export const CARD_FILE = 'matty-copa.png'

/** True when the device can hand the picture straight to other apps (phones and tablets, mostly). */
export function canShareFile(): boolean {
  try {
    return typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [new File([''], CARD_FILE, { type: 'image/png' })] })
  } catch {
    return false
  }
}

export function downloadBlob(blob: Blob, name = CARD_FILE) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}
