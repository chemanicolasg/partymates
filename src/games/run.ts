import { useRef, useState } from 'react'
import type { Profile } from '../core/store'
import type { Fact, FactResult, GameResult } from '../core/types'

export interface GameProps<C> {
  cfg: C
  profile: Profile
  /** Extra scaffolding: switched on with the 💡 button or after a failed attempt at the level. */
  hints: boolean
  onFinish: (result: GameResult) => void
  onExit: () => void
}

/** Book-keeping shared by every mini-game: one entry per round, true when solved at the first try. */
export function useRun(total: number, onFinish: (r: GameResult) => void) {
  const [results, setResults] = useState<boolean[]>([])
  const all = useRef<boolean[]>([])
  const facts = useRef<FactResult[]>([])
  const started = useRef(Date.now())
  const roundStarted = useRef(Date.now())
  const finished = useRef(false)

  return {
    results,
    /** Stores the round and tells whether the game is over. */
    record(correct: boolean, fact?: Fact): boolean {
      const now = Date.now()
      if (fact) facts.current.push({ key: fact.key, correct, ms: now - roundStarted.current })
      roundStarted.current = now
      all.current = [...all.current, correct]
      setResults(all.current)
      return all.current.length >= total
    },
    finish() {
      if (finished.current) return
      finished.current = true
      while (all.current.length < total) all.current.push(false)
      onFinish({
        correct: all.current.filter(Boolean).length,
        total,
        ms: Date.now() - started.current,
        facts: facts.current,
      })
    },
  }
}
