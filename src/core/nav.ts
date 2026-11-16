import { useSyncExternalStore } from 'react'
export type WorldSrc = 'class' | 'season' | 'family'

export type Screen =
  | { id: 'welcome' }
  | { id: 'hub' }
  /** A stop of the journey, by its position. */
  | { id: 'play'; stop: number }
  /** The teacher's homework, or the family's mission. */
  | { id: 'homework'; src?: 'class' | 'family' }
  /** What the family has sent: its mission, its world, and where to connect to it. */
  | { id: 'family' }
  /** An extra world: the teacher's for the class, or the running season's. */
  | { id: 'world'; src: WorldSrc }
  | { id: 'worldplay'; src: WorldSrc; stop: number }
  /** The number-sense mission a teacher opened for the class. */
  | { id: 'screen' }
  | { id: 'dojo' }
  | { id: 'shop' }
  | { id: 'class' }
  | { id: 'grownups' }

let stack: Screen[] = [{ id: 'welcome' }]
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

/** Opens a screen. The browser history mirrors the stack so the tablet's back gesture works. */
export function go(screen: Screen, opts: { replace?: boolean; reset?: boolean } = {}) {
  if (opts.reset) {
    stack = [screen]
    history.replaceState({ depth: 0 }, '')
  } else if (opts.replace) {
    stack = [...stack.slice(0, -1), screen]
  } else {
    stack = [...stack, screen]
    history.pushState({ depth: stack.length - 1 }, '')
  }
  emit()
}

export function back() {
  if (stack.length > 1) history.back()
}

if (typeof window !== 'undefined') {
  history.replaceState({ depth: 0 }, '')
  window.addEventListener('popstate', () => {
    if (stack.length > 1) {
      stack = stack.slice(0, -1)
      emit()
    }
  })
}

export function useScreen(): Screen {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => stack[stack.length - 1],
  )
}
