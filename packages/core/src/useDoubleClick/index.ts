import { useRef } from 'react'
import { useEventListener } from '../useEventListener'
import { useLatest } from '../useLatest'
import { useUnmount } from '../useUnmount'
import type { UseDoubleClick, UseDoubleClickProps } from './interface'

interface ClickState {
  count: number
  timer?: ReturnType<typeof setTimeout>
}

type Kind = 'click' | 'touch'

function idle(): Record<Kind, ClickState> {
  return { click: { count: 0 }, touch: { count: 0 } }
}

export const useDoubleClick: UseDoubleClick = ({
  target,
  latency = 300,
  onSingleClick = () => {},
  onDoubleClick = () => {},
}: UseDoubleClickProps) => {
  // The count and the pending timer have to outlive a render, since the handler
  // is built during render and anything held in its scope is rebuilt each time.
  // Click and touchend keep separate state, as they did when each had its own
  // closure.
  const states = useRef(idle())

  // The timer runs later than the render that armed it, so the callbacks are
  // read when it fires rather than captured, as in useDebounceFn.
  const singleClick = useLatest(onSingleClick)
  const doubleClick = useLatest(onDoubleClick)

  useUnmount(() => {
    clearTimeout(states.current.click.timer)
    clearTimeout(states.current.touch.timer)
    // Reset as well as clear: a teardown that leaves the refs alive, such as a
    // hidden <Activity> or a Fast Refresh, would otherwise leave a count of 1
    // behind with no timer left to zero it, and every later click would take
    // the early return below.
    states.current = idle()
  })

  const handle = (kind: Kind) => (e: MouseEvent | TouchEvent) => {
    // prevent ios double click slide
    if (e.type === 'touchend') {
      e.stopPropagation()
      e.preventDefault()
    }

    const state = states.current[kind]
    state.count += 1

    // One pending timer per event type, armed by the first click. That timer
    // decides the outcome and the later clicks only raise the count.
    if (state.count > 1) {
      return
    }

    state.timer = setTimeout(() => {
      const current = states.current[kind]
      const { count } = current
      // Reset before dispatching, or a callback that throws leaves the count
      // stuck and every later click takes the early return.
      current.count = 0
      current.timer = undefined

      if (count === 1) {
        singleClick.current(e)
      }
      else if (count === 2) {
        doubleClick.current(e)
      }
    }, latency)
  }

  useEventListener('click', handle('click'), target)
  useEventListener('touchend', handle('touch'), target, { passive: false })
}
