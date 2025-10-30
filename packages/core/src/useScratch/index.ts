import { useRef } from 'react'
import type { BasicTarget } from '../utils/domTarget'
import { getTargetElement } from '../utils/domTarget'
import { defaultWindow } from '../utils/browser'
import { useLatest } from '../useLatest'
import { useRafState } from '../useRafState'
import { useEventListener } from '../useEventListener'
import { useUnmount } from '../useUnmount'
import { noop } from '../utils/is'
import type { UseScratch, UseScratchOptions, UseScratchState } from './interface'

const initialState: UseScratchState = {
  isScratching: false,
}

export const useScratch: UseScratch = (
  target: BasicTarget<HTMLElement>,
  options: UseScratchOptions = {},
): UseScratchState => {
  const { disabled = false } = options
  const [state, setState] = useRafState<UseScratchState>(initialState)
  const optionsRef = useLatest(options)
  const refState = useRef<UseScratchState>(state)
  const refScratching = useRef<boolean>(false)
  const refAnimationFrame = useRef<number | null>(null)

  const onMoveEvent = (docX: number, docY: number) => {
    if (!refScratching.current) {
      return
    }
    const el = getTargetElement(target)
    if (!el) {
      return
    }

    if (refAnimationFrame.current !== null) {
      cancelAnimationFrame(refAnimationFrame.current)
    }
    refAnimationFrame.current = requestAnimationFrame(() => {
      const { left, top } = el.getBoundingClientRect()
      const elX = left + window.scrollX
      const elY = top + window.scrollY
      const x = docX - elX
      const y = docY - elY

      setState(oldState => {
        const newState: UseScratchState = {
          ...oldState,
          x,
          y,
          dx: x - (oldState.x || 0),
          dy: y - (oldState.y || 0),
          end: Date.now(),
          isScratching: true,
        }
        refState.current = newState;
        (optionsRef.current.onScratch || noop)(newState)
        return newState
      })
    })
  }

  const stopScratching = () => {
    if (!refScratching.current) {
      return
    }
    refScratching.current = false
    const endState: UseScratchState = {
      ...refState.current,
      isScratching: false,
    }
    refState.current = endState;
    (optionsRef.current.onScratchEnd || noop)(endState)
    setState(endState)
  }

  const startScratching = (docX: number, docY: number) => {
    const el = getTargetElement(target)
    if (disabled || !el) {
      return
    }

    refScratching.current = true
    const { left, top } = el.getBoundingClientRect()
    const elX = left + window.scrollX
    const elY = top + window.scrollY
    const x = docX - elX
    const y = docY - elY
    const time = Date.now()
    const newState: UseScratchState = {
      isScratching: true,
      start: time,
      end: time,
      docX,
      docY,
      x,
      y,
      dx: 0,
      dy: 0,
      elH: el.offsetHeight,
      elW: el.offsetWidth,
      elX,
      elY,
      posX: elX,
      posY: elY,
    }
    refState.current = newState;
    (optionsRef.current.onScratchStart || noop)(newState)
    setState(newState)
  }

  useEventListener(
    'mousedown',
    (event: MouseEvent) => {
      event.preventDefault()
      startScratching(event.pageX || event.clientX, event.pageY || event.clientY)
    },
    target,
  )

  useEventListener(
    'touchstart',
    (event: TouchEvent) => {
      event.preventDefault()
      startScratching(
        event.changedTouches[0].pageX || event.changedTouches[0].clientX,
        event.changedTouches[0].pageY || event.changedTouches[0].clientY,
      )
    },
    target,
  )

  useEventListener(
    'mousemove',
    (event: MouseEvent) => {
      onMoveEvent(event.pageX || event.clientX, event.pageY || event.clientY)
    },
    defaultWindow,
  )

  useEventListener(
    'touchmove',
    (event: TouchEvent) => {
      onMoveEvent(
        event.changedTouches[0].pageX || event.changedTouches[0].clientX,
        event.changedTouches[0].pageY || event.changedTouches[0].clientY,
      )
    },
    defaultWindow,
  )

  useEventListener('mouseup', stopScratching, defaultWindow)
  useEventListener('touchend', stopScratching, defaultWindow)

  useUnmount(() => {
    if (refAnimationFrame.current !== null) {
      cancelAnimationFrame(refAnimationFrame.current)
    }
  })

  return state
}
