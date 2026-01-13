import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useRef, useState } from 'react'
import { useUnmount } from '../useUnmount'

export function useRafState<S>(initialState: S | (() => S)): readonly [S, Dispatch<SetStateAction<S>>] {
  const frame = useRef(0)
  const [state, setState] = useState(initialState)
  const pendingUpdates = useRef<Array<SetStateAction<S>>>([])

  const setRafState = useCallback((value: S | ((prevState: S) => S)) => {
    pendingUpdates.current.push(value)
    cancelAnimationFrame(frame.current)

    frame.current = requestAnimationFrame(() => {
      const updates = pendingUpdates.current.splice(0)
      setState(prevState => {
        let newState = prevState
        for (const update of updates) {
          newState = typeof update === 'function' ? (update as (prevState: S) => S)(newState) : update
        }
        return newState
      })
    })
  }, [])

  useUnmount(() => {
    cancelAnimationFrame(frame.current)
  })

  return [state, setRafState] as const
}
