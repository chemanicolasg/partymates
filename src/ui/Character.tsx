import { useId, type CSSProperties, type ReactNode } from 'react'
import { bgValue, HAIR_COLORS, SKIN_TONES, type Look } from '../core/look'
import type { Profile } from '../core/store'

/**
 * Every character is drawn here as layered vector shapes on a 100×100 canvas:
 * background → back hair / ears / cape → body and outfit → head → face → glasses → hat.
 * Because the layers share one coordinate system, any hat fits any head.
 */
const INK = '#23164f'
const line = { stroke: INK, strokeWidth: 2.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
const thin = { ...line, strokeWidth: 1.6 }
const none = { stroke: 'none' }

interface Animal {
  fur: string
  /** Lighter patch around the nose and mouth. */
  muzzle?: string
  ears: 'cat' | 'round' | 'long' | 'floppy' | 'side' | 'big' | 'none'
  inner?: string
}

const ANIMALS: Record<string, Animal> = {
  fox: { fur: '#ff8a3d', muzzle: '#fff5e8', ears: 'cat', inner: '#3a2a1e' },
  panda: { fur: '#ffffff', ears: 'round', inner: '#2b2d42' },
  cat: { fur: '#ffc857', muzzle: '#fff5e8', ears: 'cat', inner: '#ff9fb8' },
  dog: { fur: '#e3b27a', muzzle: '#fff5e8', ears: 'floppy', inner: '#8b5a2b' },
  bunny: { fur: '#f6f1ff', muzzle: '#ffffff', ears: 'long', inner: '#ff9fb8' },
  frog: { fur: '#74d66f', ears: 'none' },
  bear: { fur: '#a8703f', muzzle: '#ecd0a8', ears: 'round', inner: '#ecd0a8' },
  lion: { fur: '#ffc04d', muzzle: '#fff0d2', ears: 'round', inner: '#e89a3c' },
  tiger: { fur: '#ff9a3c', muzzle: '#fff5e8', ears: 'round', inner: '#fff5e8' },
  monkey: { fur: '#8b5a2b', ears: 'side', inner: '#f0c9a0' },
  koala: { fur: '#a9adb8', ears: 'big', inner: '#f1f1f6' },
  penguin: { fur: '#2b2d42', ears: 'none' },
  robot: { fur: '#c7d0e0', ears: 'none' },
  alien: { fur: '#7be08f', ears: 'none' },
  unicorn: { fur: '#ffffff', muzzle: '#ffe3ee', ears: 'cat', inner: '#ff9fb8' },
  dragon: { fur: '#4cc9a4', muzzle: '#b8f0d8', ears: 'none' },
}

const star = (cx: number, cy: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2
    const k = i % 2 ? r * 0.45 : r
    return `${(cx + Math.cos(a) * k).toFixed(1)},${(cy + Math.sin(a) * k).toFixed(1)}`
  }).join(' ')

const heart = (cx: number, cy: number, s: number) =>
  `M${cx} ${cy + s} C${cx - s * 1.6} ${cy - s * 0.2} ${cx - s * 0.7} ${cy - s * 1.3} ${cx} ${cy - s * 0.4} C${cx + s * 0.7} ${cy - s * 1.3} ${cx + s * 1.6} ${cy - s * 0.2} ${cx} ${cy + s}Z`

// ───────────── Layers ─────────────

function Ears({ a }: { a: Animal }) {
  const inner = a.inner ?? a.fur
  switch (a.ears) {
    case 'cat':
      return (
        <g fill={a.fur} {...line}>
          <path d="M27 36 L23 10 L45 24Z" />
          <path d="M73 36 L77 10 L55 24Z" />
          <path d="M29 28 L27 16 L38 24Z" fill={inner} {...none} />
          <path d="M71 28 L73 16 L62 24Z" fill={inner} {...none} />
        </g>
      )
    case 'round':
      return (
        <g fill={a.fur} {...line}>
          <circle cx="29" cy="26" r="9.5" />
          <circle cx="71" cy="26" r="9.5" />
          <circle cx="29" cy="26" r="4.5" fill={inner} {...none} />
          <circle cx="71" cy="26" r="4.5" fill={inner} {...none} />
        </g>
      )
    case 'big':
      return (
        <g fill={a.fur} {...line}>
          <circle cx="25" cy="32" r="13" />
          <circle cx="75" cy="32" r="13" />
          <circle cx="25" cy="32" r="6.5" fill={inner} {...none} />
          <circle cx="75" cy="32" r="6.5" fill={inner} {...none} />
        </g>
      )
    case 'long':
      return (
        <g fill={a.fur} {...line}>
          <ellipse cx="39" cy="15" rx="7" ry="17" transform="rotate(-8 39 15)" />
          <ellipse cx="61" cy="15" rx="7" ry="17" transform="rotate(8 61 15)" />
          <ellipse cx="39" cy="16" rx="3" ry="11" transform="rotate(-8 39 16)" fill={inner} {...none} />
          <ellipse cx="61" cy="16" rx="3" ry="11" transform="rotate(8 61 16)" fill={inner} {...none} />
        </g>
      )
    case 'side':
      return (
        <g fill={a.fur} {...line}>
          <circle cx="25" cy="48" r="8" />
          <circle cx="75" cy="48" r="8" />
          <circle cx="25" cy="48" r="4" fill={inner} {...none} />
          <circle cx="75" cy="48" r="4" fill={inner} {...none} />
        </g>
      )
    default:
      return null
  }
}

function BackHair({ style, color }: { style: string; color: string }) {
  const p = { fill: color, ...line }
  if (style === 'long') return <path d="M25 46 C22 16 78 16 75 46 L80 80 L62 80 L62 48 L38 48 L38 80 L20 80Z" {...p} />
  if (style === 'bob') return <path d="M24 46 C21 16 79 16 76 46 L78 62 Q71 68 66 61 L66 46 L34 46 L34 61 Q29 68 22 62Z" {...p} />
  if (style === 'buns')
    return (
      <g {...p}>
        <circle cx="29" cy="23" r="9" />
        <circle cx="71" cy="23" r="9" />
      </g>
    )
  if (style === 'pony') return <path d="M70 30 C86 30 90 46 84 62 C80 54 76 48 70 46Z" {...p} />
  return null
}

function FrontHair({ style, color }: { style: string; color: string }) {
  const p = { fill: color, ...line }
  switch (style) {
    case 'spiky':
      return <path d="M27 44 L25 28 L33 32 L34 19 L43 27 L50 13 L57 27 L66 19 L67 32 L75 28 L73 44 C66 34 58 32 50 32 C42 32 34 34 27 44Z" {...p} />
    case 'curly':
      return (
        <g {...p}>
          {[[29, 40], [31, 30], [39, 23], [50, 20], [61, 23], [69, 30], [71, 40]].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="7.8" />
          ))}
          <path d="M30 38 C34 26 66 26 70 38 C62 32 38 32 30 38Z" {...none} />
        </g>
      )
    case 'swept':
    case 'long':
    case 'bob':
      return <path d="M27 45 C23 18 77 16 73 45 C72 37 66 30 58 29 C50 36 37 39 27 45Z" {...p} />
    default:
      // short, buns and pony share the same neat fringe
      return <path d="M27 44 C23 20 38 18 50 18 C62 18 77 20 73 44 C69 34 60 31 50 31 C40 31 31 34 27 44Z" {...p} />
  }
}

function Outfit({ id }: { id: string }) {
  const body = 'M12 106 C12 82 28 75 50 75 C72 75 88 82 88 106Z'
  const tee = (fill: string, trim: string) => (
    <>
      <path d={body} fill={fill} {...line} />
      <path d="M41 76 Q50 85 59 76" fill="none" {...line} stroke={trim} strokeWidth={3} />
    </>
  )
  switch (id) {
    case 'tee-red':
      return tee('#ff5a6e', '#c22740')
    case 'tee-green':
      return tee('#5fd38d', '#2f9a5c')
    case 'tee-yellow':
      return tee('#ffd23f', '#d79a00')
    case 'tee-purple':
      return tee('#a47bff', '#6c3fd6')
    case 'stripes':
      return (
        <>
          <path d={body} fill="#ffffff" {...line} />
          {[82, 89, 96].map((y) => (
            <path key={y} d={`M10 ${y} H90`} stroke="#3d7bf5" strokeWidth="3.4" />
          ))}
          <path d={body} fill="none" {...line} />
        </>
      )
    case 'hoodie':
      return (
        <>
          <path d={body} fill="#ff9f43" {...line} />
          <path d="M34 77 Q50 94 66 77 L62 74 Q50 86 38 74Z" fill="#e07e1e" {...line} />
          <path d="M45 86 V96 M55 86 V96" fill="none" {...thin} stroke="#fff" strokeWidth={2.2} />
        </>
      )
    case 'football':
      return (
        <>
          <path d={body} fill="#ffffff" {...line} />
          {[24, 44, 64, 84].map((x) => (
            <path key={x} d={`M${x} 74 V106`} stroke="#e8375a" strokeWidth="8" />
          ))}
          <path d={body} fill="none" {...line} />
          <circle cx="50" cy="91" r="7.5" fill="#fff" {...thin} />
          <text x="50" y="94.6" textAnchor="middle" fontSize="9" fontWeight="700" fill={INK}>
            10
          </text>
        </>
      )
    case 'dungarees':
      return (
        <>
          <path d={body} fill="#ffd23f" {...line} />
          <path d="M36 76 L38 86 M64 76 L62 86" fill="none" {...line} stroke="#3d7bf5" strokeWidth={5} />
          <rect x="35" y="84" width="30" height="22" rx="4" fill="#3d7bf5" {...line} />
          <circle cx="39.5" cy="88.5" r="1.8" fill="#ffd23f" />
          <circle cx="60.5" cy="88.5" r="1.8" fill="#ffd23f" />
        </>
      )
    case 'pirate':
      return (
        <>
          <path d={body} fill="#ffffff" {...line} />
          <path d="M12 106 C12 84 26 77 40 76 L44 106Z" fill="#c22740" {...line} />
          <path d="M88 106 C88 84 74 77 60 76 L56 106Z" fill="#c22740" {...line} />
          <path d="M41 76 L50 88 L59 76" fill="none" {...thin} />
        </>
      )
    case 'lab':
      return (
        <>
          <path d={body} fill="#ffffff" {...line} />
          <path d="M40 76 L50 92 L60 76Z" fill="#5cc8ff" {...line} />
          <path d="M40 76 L44 90 L50 92 M60 76 L56 90 L50 92" fill="none" {...thin} />
          <rect x="63" y="90" width="9" height="8" rx="1.5" fill="none" {...thin} />
          <path d="M66 88 V93" stroke="#e8375a" strokeWidth="2" strokeLinecap="round" />
        </>
      )
    case 'ninja':
      return (
        <>
          <path d={body} fill="#2b2d42" {...line} />
          <path d="M30 78 L70 100 L70 92 L36 76Z" fill="#e8375a" {...thin} />
        </>
      )
    case 'wizard':
      return (
        <>
          <path d={body} fill="#6c3fd6" {...line} />
          <polygon points={star(32, 92, 4.5)} fill="#ffd23f" />
          <polygon points={star(66, 88, 3.6)} fill="#ffd23f" />
          <polygon points={star(52, 97, 3)} fill="#ffd23f" />
          <path d="M38 76 Q50 86 62 76" fill="none" {...line} stroke="#ffd23f" strokeWidth={3} />
        </>
      )
    case 'tux':
      return (
        <>
          <path d={body} fill="#2b2d42" {...line} />
          <path d="M41 76 L50 100 L59 76Z" fill="#ffffff" {...line} />
          <path d="M50 83 L42 79 L42 87Z M50 83 L58 79 L58 87Z" fill="#e8375a" {...thin} />
          <circle cx="50" cy="83" r="2" fill="#e8375a" {...thin} />
        </>
      )
    case 'hero':
      return (
        <>
          <path d="M8 108 L22 74 L78 74 L92 108Z" fill="#3d7bf5" {...line} />
          <path d={body} fill="#ff4d6d" {...line} />
          <polygon points={star(50, 91, 8)} fill="#ffd23f" {...thin} />
        </>
      )
    case 'astro':
      return (
        <>
          <path d={body} fill="#f3f5fa" {...line} />
          <ellipse cx="50" cy="77" rx="16" ry="5" fill="#c7d0e0" {...line} />
          <rect x="40" y="86" width="20" height="11" rx="3" fill="#dfe5f0" {...thin} />
          <circle cx="45" cy="91.5" r="2" fill="#e8375a" />
          <circle cx="51" cy="91.5" r="2" fill="#5cc8ff" />
          <circle cx="71" cy="88" r="4.5" fill="#3d7bf5" {...thin} />
        </>
      )
    case 'royal':
      return (
        <>
          <path d={body} fill="#c22740" {...line} />
          <path d="M28 80 Q50 100 72 80 L68 73 Q50 88 32 73Z" fill="#ffffff" {...line} />
          {[[37, 82], [45, 86], [55, 86], [63, 82]].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="1.4" fill={INK} />
          ))}
          <circle cx="50" cy="96" r="3.4" fill="#ffd23f" {...thin} />
        </>
      )
    default:
      return tee('#4d8dff', '#2456c9')
  }
}

function Glasses({ id }: { id: string }) {
  switch (id) {
    case 'round':
      return (
        <g fill="rgba(255,255,255,.3)" {...line}>
          <circle cx="41" cy="47" r="7.6" />
          <circle cx="59" cy="47" r="7.6" />
          <path d="M48.6 47 H51.4" />
        </g>
      )
    case 'sun':
      return (
        <g fill={INK} {...line}>
          <rect x="32" y="41.5" width="16" height="11" rx="4.5" />
          <rect x="52" y="41.5" width="16" height="11" rx="4.5" />
          <path d="M48 45 H52" />
          <path d="M35.5 45 L39 44 M55.5 45 L59 44" stroke="#fff" strokeWidth="1.6" />
        </g>
      )
    case 'star':
      return (
        <g fill="rgba(255,210,63,.85)" {...thin}>
          <polygon points={star(41, 47, 9)} />
          <polygon points={star(59, 47, 9)} />
        </g>
      )
    case 'heart':
      return (
        <g fill="rgba(255,107,157,.85)" {...thin}>
          <path d={heart(41, 47, 6.4)} />
          <path d={heart(59, 47, 6.4)} />
        </g>
      )
    case 'goggles':
      return (
        <g {...line}>
          <rect x="25" y="43" width="50" height="8" rx="3" fill="#8b5a2b" />
          <circle cx="41" cy="47" r="8" fill="rgba(125,249,255,.75)" stroke="#6c7689" strokeWidth="3.2" />
          <circle cx="59" cy="47" r="8" fill="rgba(125,249,255,.75)" stroke="#6c7689" strokeWidth="3.2" />
        </g>
      )
    case 'patch':
      return (
        <g {...line}>
          <path d="M27 36 L74 52" fill="none" />
          <ellipse cx="41" cy="47" rx="7.6" ry="6.8" fill={INK} />
        </g>
      )
    case '3d':
      return (
        <g {...line}>
          <rect x="30.5" y="40.5" width="39" height="13" rx="3.5" fill="#ffffff" />
          <rect x="33.5" y="43" width="13.5" height="8" rx="1.5" fill="#ff4d6d" {...none} />
          <rect x="53" y="43" width="13.5" height="8" rx="1.5" fill="#35c9e8" {...none} />
        </g>
      )
    case 'monocle':
      return (
        <g fill="rgba(255,255,255,.3)" stroke="#d79a00" strokeWidth="2.6" strokeLinecap="round">
          <circle cx="59" cy="47" r="8" />
          <path d="M66 52 Q72 62 68 72" fill="none" strokeWidth="1.5" />
        </g>
      )
    default:
      return null
  }
}

function Hat({ id }: { id: string }) {
  switch (id) {
    case 'cap':
      return (
        <g {...line}>
          <path d="M27 34 C25 10 75 10 73 34Z" fill="#ff4d6d" />
          <path d="M28 33 C14 32 9 37 12 41 C24 37 40 36 52 34Z" fill="#c22740" />
          <circle cx="50" cy="15.5" r="2.4" fill="#fff" />
        </g>
      )
    case 'beanie':
      return (
        <g {...line}>
          <path d="M27 34 C25 10 75 10 73 34Z" fill="#35b8c9" />
          <rect x="24.5" y="28.5" width="51" height="9" rx="4.5" fill="#1f8a99" />
          <circle cx="50" cy="12" r="6.5" fill="#ffffff" />
        </g>
      )
    case 'bow':
      return (
        <g fill="#ff6b9d" {...line}>
          <path d="M64 21 L50 12 L51 30Z" />
          <path d="M64 21 L78 12 L77 30Z" />
          <circle cx="64" cy="21" r="4.2" fill="#ff8fb8" />
        </g>
      )
    case 'party':
      return (
        <g {...line}>
          <path d="M36 29 L50 1 L64 29Z" fill="#ffd23f" />
          <path d="M41.5 18 L59.5 22 M45 11 L56 13.5" stroke="#ff4d6d" strokeWidth="3" />
          <path d="M36 29 L50 1 L64 29Z" fill="none" />
          <circle cx="50" cy="2.5" r="4.4" fill="#ff6b9d" />
        </g>
      )
    case 'headphones':
      return (
        <g {...line}>
          <path d="M24 46 C22 12 78 12 76 46" fill="none" strokeWidth="6.5" />
          <path d="M24 46 C22 12 78 12 76 46" fill="none" stroke="#ff4d6d" strokeWidth="3" />
          <rect x="17" y="40" width="11" height="18" rx="5" fill="#ff4d6d" />
          <rect x="72" y="40" width="11" height="18" rx="5" fill="#ff4d6d" />
        </g>
      )
    case 'cowboy':
      return (
        <g {...line}>
          <path d="M10 30 Q30 38 50 32 Q70 38 90 30 Q72 22 50 26 Q28 22 10 30Z" fill="#a66a3f" />
          <path d="M33 28 C33 6 44 9 50 13 C56 9 67 6 67 28 Q50 23 33 28Z" fill="#c08552" />
          <path d="M33.5 24 Q50 19 66.5 24" fill="none" stroke="#6b4226" strokeWidth="3" />
        </g>
      )
    case 'tophat':
      return (
        <g {...line}>
          <rect x="33" y="3" width="34" height="25" rx="2.5" fill="#2b2d42" />
          <rect x="33" y="19" width="34" height="6" fill="#e8375a" {...none} />
          <rect x="24" y="26" width="52" height="6" rx="3" fill="#2b2d42" />
        </g>
      )
    case 'pirate':
      return (
        <g {...line}>
          <path d="M18 33 C24 6 76 6 82 33 C64 25 36 25 18 33Z" fill="#2b2d42" />
          <circle cx="50" cy="20" r="4.4" fill="#ffffff" {...none} />
          <path d="M43 26.5 L57 22 M43 22 L57 26.5" stroke="#fff" strokeWidth="2" />
          <circle cx="48.4" cy="19.6" r="1" fill={INK} {...none} />
          <circle cx="51.6" cy="19.6" r="1" fill={INK} {...none} />
        </g>
      )
    case 'chef':
      return (
        <g fill="#ffffff" {...line}>
          <circle cx="38" cy="15" r="9.5" />
          <circle cx="62" cy="15" r="9.5" />
          <circle cx="50" cy="11" r="10.5" />
          <rect x="34" y="17" width="32" height="14" rx="2" />
          <path d="M40 22 V28 M50 22 V28 M60 22 V28" {...thin} stroke="#c7d0e0" />
        </g>
      )
    case 'wizard':
      return (
        <g {...line}>
          <path d="M31 30 L55 -3 L69 30Z" fill="#5b3fd6" />
          <ellipse cx="50" cy="30" rx="31" ry="6.5" fill="#6c4de8" />
          <polygon points={star(51, 16, 5)} fill="#ffd23f" {...none} />
        </g>
      )
    case 'viking':
      return (
        <g {...line}>
          <path d="M30 25 C19 24 13 14 17 5 C22 13 27 16 33 17Z" fill="#fff5e8" />
          <path d="M70 25 C81 24 87 14 83 5 C78 13 73 16 67 17Z" fill="#fff5e8" />
          <path d="M27 34 C25 10 75 10 73 34Z" fill="#b9c2d3" />
          <rect x="25" y="29" width="50" height="7" rx="3" fill="#8f9bb0" />
          <path d="M50 13 V29" {...thin} />
        </g>
      )
    case 'grad':
      return (
        <g {...line}>
          <path d="M34 22 V31 Q50 37 66 31 V22Z" fill="#2b2d42" />
          <path d="M50 6 L84 17 L50 28 L16 17Z" fill="#3d405b" />
          <path d="M50 17 L76 20 V31" fill="none" stroke="#ffd23f" strokeWidth="2" />
          <circle cx="76" cy="32" r="2.6" fill="#ffd23f" {...none} />
        </g>
      )
    case 'crown':
      return (
        <g {...line}>
          <path d="M30 31 L26 9 L39 19 L50 4 L61 19 L74 9 L70 31Z" fill="#ffd23f" />
          <circle cx="39" cy="25.5" r="2.4" fill="#e8375a" {...none} />
          <circle cx="50" cy="24.5" r="2.8" fill="#3d7bf5" {...none} />
          <circle cx="61" cy="25.5" r="2.4" fill="#5fd38d" {...none} />
        </g>
      )
    case 'matty':
      // Matty's own headset: yellow ear-pods and the antenna with its sparkle.
      return (
        <g {...line}>
          <path d="M26 41 C24 12 76 12 74 41" fill="none" strokeWidth="7.5" />
          <path d="M26 41 C24 12 76 12 74 41" fill="none" stroke="#f7f9fc" strokeWidth="3.6" />
          <rect x="18" y="36" width="11" height="19" rx="5.5" fill="#ffd23f" />
          <rect x="71" y="36" width="11" height="19" rx="5.5" fill="#ffd23f" />
          <path d="M62 17 L68 5" fill="none" />
          <polygon points={star(69, 3, 6)} fill="#ffd23f" {...thin} />
        </g>
      )
    case 'astro':
      return (
        <g>
          <circle cx="50" cy="46" r="32" fill="rgba(170,225,255,.12)" stroke={INK} strokeWidth="6.4" />
          <circle cx="50" cy="46" r="32" fill="none" stroke="#eef2f8" strokeWidth="3.6" />
          <path d="M28 34 Q34 22 46 18" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".8" />
        </g>
      )
    default:
      return null
  }
}

function Face({ eyeColor = INK, y = 47 }: { eyeColor?: string; y?: number }) {
  return (
    <>
      <circle cx="35" cy="56" r="4.2" fill="#ff8fa3" opacity=".5" />
      <circle cx="65" cy="56" r="4.2" fill="#ff8fa3" opacity=".5" />
      <circle cx="41" cy={y} r="3.3" fill={eyeColor} />
      <circle cx="59" cy={y} r="3.3" fill={eyeColor} />
      <circle cx="39.9" cy={y - 1.1} r="1.1" fill="#fff" />
      <circle cx="57.9" cy={y - 1.1} r="1.1" fill="#fff" />
    </>
  )
}

const smile = <path d="M44 58 Q50 63.5 56 58" fill="none" {...line} />
const snout = (
  <>
    <ellipse cx="50" cy="53.4" rx="3.4" ry="2.5" fill={INK} />
    <path d="M45 57.5 Q47.5 60.6 50 57.5 Q52.5 60.6 55 57.5" fill="none" {...thin} strokeWidth={2} />
  </>
)

function Head({ look }: { look: Look }) {
  const skin = SKIN_TONES[look.tone] ?? SKIN_TONES[1]
  const hair = HAIR_COLORS[look.hairColor] ?? HAIR_COLORS[0]
  if (look.base === 'kid')
    return (
      <>
        <BackHair style={look.hair} color={hair} />
        <rect x="44" y="64" width="12" height="13" rx="4" fill={skin} {...line} />
        <circle cx="27.5" cy="48.5" r="4.4" fill={skin} {...line} />
        <circle cx="72.5" cy="48.5" r="4.4" fill={skin} {...line} />
        <ellipse cx="50" cy="46" rx="22.5" ry="23.5" fill={skin} {...line} />
        <Face />
        {smile}
        <FrontHair style={look.hair} color={hair} />
      </>
    )

  const a = ANIMALS[look.base] ?? ANIMALS.fox
  const head = <ellipse cx="50" cy="47" rx="24.5" ry="22.5" fill={a.fur} {...line} />
  const muzzle = a.muzzle ? <ellipse cx="50" cy="57" rx="13" ry="9.5" fill={a.muzzle} /> : null

  switch (look.base) {
    case 'panda':
      return (
        <>
          <Ears a={a} />
          {head}
          <ellipse cx="40.5" cy="47" rx="6.4" ry="7.8" fill="#2b2d42" transform="rotate(14 40.5 47)" />
          <ellipse cx="59.5" cy="47" rx="6.4" ry="7.8" fill="#2b2d42" transform="rotate(-14 59.5 47)" />
          <Face eyeColor="#ffffff" />
          <circle cx="41" cy="47" r="1.5" fill={INK} />
          <circle cx="59" cy="47" r="1.5" fill={INK} />
          {snout}
        </>
      )
    case 'frog':
      return (
        <>
          <circle cx="37" cy="28" r="10" fill={a.fur} {...line} />
          <circle cx="63" cy="28" r="10" fill={a.fur} {...line} />
          {head}
          <circle cx="37" cy="28" r="6" fill="#fff" {...thin} />
          <circle cx="63" cy="28" r="6" fill="#fff" {...thin} />
          <circle cx="37.6" cy="28.6" r="2.8" fill={INK} />
          <circle cx="63.6" cy="28.6" r="2.8" fill={INK} />
          <circle cx="34" cy="55" r="4.2" fill="#ff8fa3" opacity=".5" />
          <circle cx="66" cy="55" r="4.2" fill="#ff8fa3" opacity=".5" />
          <path d="M37 53 Q50 65 63 53" fill="none" {...line} />
          <circle cx="47" cy="46" r="1" fill={INK} />
          <circle cx="53" cy="46" r="1" fill={INK} />
        </>
      )
    case 'dog':
      return (
        <>
          {head}
          <ellipse cx="59.5" cy="46" rx="8" ry="9" fill="#c08552" opacity=".75" />
          {muzzle}
          <ellipse cx="26" cy="46" rx="7.5" ry="15" fill={a.inner} {...line} transform="rotate(12 26 46)" />
          <ellipse cx="74" cy="46" rx="7.5" ry="15" fill={a.inner} {...line} transform="rotate(-12 74 46)" />
          <Face />
          {snout}
          <path d="M50 60.5 Q50 66 53.5 65 Q55.5 63 54 60" fill="#ff8fa3" {...thin} />
        </>
      )
    case 'bunny':
      return (
        <>
          <Ears a={a} />
          {head}
          {muzzle}
          <Face />
          <ellipse cx="50" cy="53.4" rx="3" ry="2.2" fill="#ff8fa3" />
          <path d="M45 57.5 Q47.5 60.6 50 57.5 Q52.5 60.6 55 57.5" fill="none" {...thin} strokeWidth={2} />
          <rect x="47.4" y="60" width="5.2" height="5" rx="1.2" fill="#fff" {...thin} />
        </>
      )
    case 'lion':
      return (
        <>
          <g fill="#d9822b" {...line}>
            {Array.from({ length: 12 }, (_, i) => {
              const ang = (Math.PI * 2 * i) / 12
              return <circle key={i} cx={50 + Math.cos(ang) * 26} cy={47 + Math.sin(ang) * 25} r="9" />
            })}
          </g>
          <Ears a={a} />
          <ellipse cx="50" cy="47" rx="22" ry="21" fill={a.fur} {...line} />
          {muzzle}
          <Face />
          {snout}
        </>
      )
    case 'tiger':
      return (
        <>
          <Ears a={a} />
          {head}
          {muzzle}
          <g fill={INK}>
            <path d="M50 25 L47 34 L53 34Z" />
            <path d="M41 27 L41 35 L45.5 33Z" />
            <path d="M59 27 L59 35 L54.5 33Z" />
            <path d="M26 44 L33 46 L26.5 49Z" />
            <path d="M74 44 L67 46 L73.5 49Z" />
            <path d="M27.5 54 L33.5 54 L29 58Z" />
            <path d="M72.5 54 L66.5 54 L71 58Z" />
          </g>
          <Face />
          {snout}
        </>
      )
    case 'monkey':
      return (
        <>
          <Ears a={a} />
          {head}
          <path d="M50 35 C42 30 31 36 33 47 C29 58 40 68 50 67 C60 68 71 58 67 47 C69 36 58 30 50 35Z" fill={a.inner} />
          <Face />
          <ellipse cx="48" cy="53.5" rx="1.1" ry="1.5" fill={INK} />
          <ellipse cx="52" cy="53.5" rx="1.1" ry="1.5" fill={INK} />
          {smile}
        </>
      )
    case 'koala':
      return (
        <>
          <Ears a={a} />
          {head}
          <Face />
          <ellipse cx="50" cy="53" rx="5.2" ry="6.8" fill={INK} />
          <path d="M45 62 Q50 65.5 55 62" fill="none" {...thin} strokeWidth={2} />
        </>
      )
    case 'penguin':
      return (
        <>
          {head}
          <path d="M50 36 C43 29 30 35 31 48 C31 61 41 68 50 68 C59 68 69 61 69 48 C70 35 57 29 50 36Z" fill="#ffffff" />
          <Face />
          <path d="M45 54 L55 54 L50 61Z" fill="#ff9f43" {...thin} />
        </>
      )
    case 'robot':
      return (
        <>
          <path d="M50 26 V14" fill="none" {...line} />
          <circle cx="50" cy="12" r="4" fill="#ff4d6d" {...line} />
          <rect x="20" y="42" width="8" height="12" rx="3" fill="#8f9bb0" {...line} />
          <rect x="72" y="42" width="8" height="12" rx="3" fill="#8f9bb0" {...line} />
          <rect x="26" y="26" width="48" height="43" rx="11" fill={a.fur} {...line} />
          <circle cx="41" cy="45" r="6.5" fill="#7df9ff" {...line} />
          <circle cx="59" cy="45" r="6.5" fill="#7df9ff" {...line} />
          <circle cx="41" cy="45" r="2.4" fill={INK} />
          <circle cx="59" cy="45" r="2.4" fill={INK} />
          <rect x="40" y="56" width="20" height="7" rx="2.5" fill="#fff" {...thin} />
          <path d="M45 56 V63 M50 56 V63 M55 56 V63" {...thin} />
        </>
      )
    case 'alien':
      return (
        <>
          <path d="M40 27 L35 13 M60 27 L65 13" fill="none" {...line} />
          <circle cx="34.5" cy="11.5" r="3.6" fill="#ffd23f" {...line} />
          <circle cx="65.5" cy="11.5" r="3.6" fill="#ffd23f" {...line} />
          <path d="M50 24 C70 24 76 38 74 49 C72 62 60 70 50 70 C40 70 28 62 26 49 C24 38 30 24 50 24Z" fill={a.fur} {...line} />
          <ellipse cx="40.5" cy="46" rx="6" ry="8.5" fill={INK} transform="rotate(18 40.5 46)" />
          <ellipse cx="59.5" cy="46" rx="6" ry="8.5" fill={INK} transform="rotate(-18 59.5 46)" />
          <circle cx="38.6" cy="43" r="1.8" fill="#fff" />
          <circle cx="57.6" cy="43" r="1.8" fill="#fff" />
          <path d="M46 61 Q50 64 54 61" fill="none" {...thin} strokeWidth={2} />
        </>
      )
    case 'unicorn':
      return (
        <>
          <g {...line}>
            <circle cx="27" cy="34" r="8" fill="#ff8fb8" />
            <circle cx="23" cy="46" r="8" fill="#b99bff" />
            <circle cx="25" cy="58" r="8" fill="#8fd3ff" />
          </g>
          <Ears a={a} />
          {head}
          {muzzle}
          <path d="M50 1 L44.5 25 L55.5 25Z" fill="#ffd23f" {...line} />
          <path d="M47.6 12 L53 14.5 M46.2 18.5 L54.4 21.5" stroke="#d79a00" strokeWidth="1.8" />
          <Face />
          <circle cx="47" cy="56.5" r="1.1" fill={INK} />
          <circle cx="53" cy="56.5" r="1.1" fill={INK} />
          <path d="M45 60.5 Q50 64.5 55 60.5" fill="none" {...thin} strokeWidth={2} />
        </>
      )
    case 'dragon':
      return (
        <>
          <path d="M33 30 L27 10 L42 23Z" fill="#fff5e8" {...line} />
          <path d="M67 30 L73 10 L58 23Z" fill="#fff5e8" {...line} />
          <path d="M26 44 L15 38 L21 52Z" fill="#35a585" {...line} />
          <path d="M74 44 L85 38 L79 52Z" fill="#35a585" {...line} />
          {head}
          <path d="M44 25 L50 15 L56 25Z" fill="#ffd23f" {...line} />
          {muzzle}
          <Face />
          <circle cx="46.5" cy="54" r="1.4" fill={INK} />
          <circle cx="53.5" cy="54" r="1.4" fill={INK} />
          <path d="M43 59.5 Q50 65 57 59.5" fill="none" {...thin} strokeWidth={2} />
          <path d="M46 61.2 L47.6 64 L49.2 62Z" fill="#fff" {...none} />
        </>
      )
    default:
      // fox, cat, bear: ears, head, muzzle, face
      return (
        <>
          <Ears a={a} />
          {head}
          {look.base === 'fox' ? <path d="M26 50 C30 66 42 70 50 70 C58 70 70 66 74 50 C66 56 58 52 50 58 C42 52 34 56 26 50Z" fill={a.muzzle} /> : muzzle}
          {look.base === 'cat' ? <path d="M30 55 L21 53 M30 58 L21 60 M70 55 L79 53 M70 58 L79 60" {...thin} strokeWidth={1.4} /> : null}
          <Face />
          {snout}
        </>
      )
  }
}

/** The character alone on a 100×100 canvas, for placing inside another picture. */
export function CharacterArt({ look }: { look: Look }) {
  const clip = useId()
  // Frogs carry their eyes on top of the head, so glasses sit higher on them.
  const glassesShift = look.base === 'frog' ? 'translate(4 -19) scale(.92)' : look.base === 'robot' ? 'translate(0 -2)' : undefined
  return (
    <>
      <defs>
        <clipPath id={clip}>
          <circle cx="50" cy="52" r="46.5" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <Outfit id={look.outfit} />
      </g>
      <Head look={look} />
      {look.glasses ? (
        <g transform={glassesShift}>
          <Glasses id={look.glasses} />
        </g>
      ) : null}
      {look.hat ? (
        <g transform={look.base === 'frog' && look.hat !== 'astro' && look.hat !== 'headphones' ? 'translate(0 -13)' : undefined}>
          <Hat id={look.hat} />
        </g>
      ) : null}
    </>
  )
}

/** The drawn character on its coloured disc. `size` is in CSS pixels. */
export function Character({ look, size = 56, bounce }: { look: Look; size?: number; bounce?: boolean }) {
  let pet: ReactNode = null
  if (look.pet) pet = <span className="character-pet">{look.pet}</span>
  return (
    <span className={`character${bounce ? ' bounce' : ''}`} style={{ '--size': `${size}px` } as CSSProperties}>
      <span className="character-bg" style={{ background: bgValue(look) }} />
      <svg viewBox="0 0 100 100" aria-hidden="true" fontFamily="inherit">
        <CharacterArt look={look} />
      </svg>
      {pet}
    </span>
  )
}

export function ProfileAvatar({ p, size, bounce }: { p: Profile; size?: number; bounce?: boolean }) {
  return <Character look={p.look} size={size} bounce={bounce} />
}
