import type { MutableRefObject } from 'react'
import { useCallback, useRef } from 'react'
import { useEventListener } from '../useEventListener'
import { useUnmount } from '../useUnmount'
import type { UseDoubleClick, UseDoubleClickProps } from './interface'

interface ClickState {
  count: number
  timer?: ReturnType<typeof setTimeout>
}

export const useDoubleClick: UseDoubleClick = ({
  target,
  latency = 300,
  onSingleClick = () => {},
  onDoubleClick = () => {},
}: UseDoubleClickProps) => {
  // The count and the pending timer have to outlive a render: `handle` is
  // called during render, so anything held in its scope is rebuilt each time,
  // while `useEventListener` dispatches to the newest closure. Click and
  // touchend keep separate state, as they did when each got its own closure.
  const clickState = useRef<ClickState>({ count: 0 })
  const touchState = useRef<ClickState>({ count: 0 })

  const handle = useCallback(
    (
      state: MutableRefObject<ClickState>,
      onSingleClick: (e?: MouseEvent | TouchEvent) => void,
      onDoubleClick: (e?: MouseEvent | TouchEvent) => void,
    ) => {
      return (e: MouseEvent | TouchEvent) => {
        // prevent ios double click slide
        if (e.type === 'touchend') {
          e.stopPropagation()
          e.preventDefault()
        }

        state.current.count += 1
        // Only the timer started by the first click decides the outcome. The
        // ones the later clicks started saw a count already reset to 0 and did
        // nothing, so there is no need to start them.
        if (state.current.count > 1) {
          return
        }

        state.current.timer = setTimeout(() => {
          if (state.current.count === 1) {
            onSingleClick(e)
          }
          else if (state.current.count === 2) {
            onDoubleClick(e)
          }
          state.current.count = 0
        }, latency)
      }
    },
    [latency],
  )

  useUnmount(() => {
    clearTimeout(clickState.current.timer)
    clearTimeout(touchState.current.timer)
  })

  const handleClick = handle(clickState, onSingleClick, onDoubleClick)

  const handleTouchEnd = handle(touchState, onSingleClick, onDoubleClick)

  useEventListener('click', handleClick, target)
  useEventListener('touchend', handleTouchEnd, target, { passive: false })
}
