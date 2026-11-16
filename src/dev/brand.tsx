/**
 * Matty's model sheet. Open /brand.html on the dev server; brand/ holds the exported files.
 * Development only: it is not part of the published app.
 */
import '@fontsource-variable/fredoka'
import { createRoot } from 'react-dom/client'
import '../styles/base.css'
import { Matty, MattyFace, MattySays, Sparkle, type MattyPose } from '../ui/Matty'

const POSES: [MattyPose, string][] = [
  ['hi', 'Saluda'],
  ['happy', 'Contento'],
  ['cheer', 'Celebra'],
  ['think', 'Piensa (pista)'],
  ['oops', 'Anima'],
  ['gift', 'Regala'],
  ['wow', 'Sorpresa'],
  ['point', 'Señala'],
]
const PALETTE: [string, string][] = [
  ['Turquesa Matty', '#35c9b8'],
  ['Turquesa sombra', '#1fa596'],
  ['Barriga', '#e6fff7'],
  ['Amarillo sol', '#ffd23f'],
  ['Amarillo sombra', '#f2a900'],
  ['Mofletes', '#ff9fb5'],
  ['Tinta', '#23164f'],
  ['Violeta de marca', '#7c4dff'],
]
const BGS = ['#fffdf7', '#7c4dff', '#5cc8ff', '#7fd36b', '#ffe39a', '#ff7ac3', '#23164f']
const ink = '#23164f'
const h2 = { fontSize: 20, margin: '26px 0 10px' }

createRoot(document.getElementById('root')!).render(
  <div style={{ padding: 28, background: '#fffdf7', fontFamily: 'Fredoka Variable', color: ink, width: 1100 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <Matty pose="hi" size={120} />
      <div>
        <h1 style={{ fontSize: 44, margin: 0 }}>Matty · hoja de modelo</h1>
        <p style={{ margin: 0, fontSize: 18 }}>Explorador turquesa con bufanda amarilla. Sus dos orejas dibujan una «M».</p>
      </div>
    </div>

    <h2 style={h2}>Poses</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      {POSES.map(([p, label]) => (
        <figure key={p} data-pose={p} style={{ margin: 0, textAlign: 'center', background: '#f3effc', borderRadius: 22, padding: 12 }}>
          <Matty pose={p} size={200} />
          <figcaption style={{ fontWeight: 700 }}>{label}</figcaption>
        </figure>
      ))}
    </div>

    <h2 style={h2}>Colores</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 10 }}>
      {PALETTE.map(([name, hex]) => (
        <div key={hex} style={{ textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
          <div style={{ height: 62, borderRadius: 14, background: hex, border: `3px solid ${ink}` }} />
          {name}
          <br />
          <code>{hex}</code>
        </div>
      ))}
    </div>

    <h2 style={h2}>Sobre fondos · tamaños · cabeza sola</h2>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      {BGS.map((bg) => (
        <div key={bg} style={{ background: bg, borderRadius: 16, padding: 8, border: bg === '#fffdf7' ? '2px solid #e4dff5' : undefined }}>
          <Matty pose="happy" size={84} />
        </div>
      ))}
      {[96, 64, 44, 30, 20].map((s) => (
        <MattyFace key={s} size={s} />
      ))}
      {(['cheer', 'think', 'oops', 'wow'] as MattyPose[]).map((p) => (
        <MattyFace key={p} pose={p} size={64} />
      ))}
    </div>

    <h2 style={h2}>Voz · motivo de marca</h2>
    <div style={{ display: 'flex', gap: 30, alignItems: 'center' }}>
      <div style={{ width: 430 }}>
        <MattySays pose="think">Mmm… cuenta cuánto llevas y cuánto te falta. ¡Tú puedes!</MattySays>
      </div>
      <svg viewBox="0 0 120 40" width="240" height="80" aria-hidden="true">
        <Sparkle x={20} y={20} size={15} />
        <Sparkle x={60} y={20} size={11} fill="#ff4d6d" />
        <Sparkle x={96} y={20} size={15} fill="#35c9b8" />
      </svg>
      <p style={{ margin: 0, maxWidth: 280, fontSize: 16 }}>El destello de cuatro puntas («+») acompaña a Matty cuando celebra o da una pista.</p>
    </div>
  </div>,
)
