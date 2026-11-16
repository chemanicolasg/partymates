import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Icon } from './icons'
import { sfx } from '../core/audio'
import { useT } from '../i18n'

/**
 * A squared-paper notepad that slides over the lower half of a game so children can work a sum
 * out by hand, exactly as they would in their maths notebook. Timed games pause while it is open.
 */
let open = false
const listeners = new Set<() => void>()
const setOpen = (value: boolean) => {
  open = value
  listeners.forEach((l) => l())
}
export const isPadOpen = () => open
export const closePad = () => setOpen(false)
const usePad = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => open,
  )

export function PadButton() {
  const { t } = useT()
  const isOpen = usePad()
  return (
    <button
      className={`icon-btn pad-btn${isOpen ? ' on' : ''}`}
      onClick={() => {
        sfx('tap')
        setOpen(!isOpen)
      }}
      aria-pressed={isOpen}
      aria-label={t('pad')}
    >
      <Icon name="pencil" size={22} />
    </button>
  )
}

type Tool = 'pen' | 'red' | 'eraser'
const COLORS: Record<Tool, string> = { pen: '#23164f', red: '#e8375a', eraser: '#000' }

export function Scratchpad() {
  const { t } = useT()
  const isOpen = usePad()
  const canvas = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('pen')
  const last = useRef<{ x: number; y: number } | null>(null)
  const sized = useRef(false)

  // The pad belongs to one game: closing the game closes it.
  useEffect(() => () => setOpen(false), [])

  // Size the drawing surface once, the first time it becomes visible (resizing would wipe it).
  useEffect(() => {
    const c = canvas.current
    if (!isOpen || !c || sized.current) return
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    c.width = Math.round(c.clientWidth * ratio)
    c.height = Math.round(c.clientHeight * ratio)
    c.getContext('2d')?.scale(ratio, ratio)
    sized.current = true
  }, [isOpen])

  const point = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const draw = (e: React.PointerEvent) => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx || !last.current) return
    const p = point(e)
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.strokeStyle = COLORS[tool]
    ctx.lineWidth = tool === 'eraser' ? 26 : 3.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
  }
  const clear = () => {
    const c = canvas.current
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height)
  }

  return (
    <div className={`pad${isOpen ? ' open' : ''}`} aria-hidden={!isOpen}>
      <div className="pad-tools">
        {(['pen', 'red', 'eraser'] as Tool[]).map((k) => (
          <button key={k} className={`pad-tool ${k}${tool === k ? ' on' : ''}`} onClick={() => setTool(k)} aria-pressed={tool === k} aria-label={t(`pad.${k}`)}>
            {k === 'eraser' ? '🧽' : <i />}
          </button>
        ))}
        <button className="pad-tool" onClick={clear} aria-label={t('pad.clear')}>
          🗑️
        </button>
        <button className="btn btn-small btn-primary" onClick={() => setOpen(false)}>
          ✔ {t('pad.done')}
        </button>
      </div>
      <canvas
        ref={canvas}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          last.current = point(e)
          draw(e)
        }}
        onPointerMove={draw}
        onPointerUp={() => (last.current = null)}
        onPointerCancel={() => (last.current = null)}
      />
    </div>
  )
}
