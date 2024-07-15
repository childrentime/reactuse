import { defaultWindow } from '../utils/browser'
import { useEventListener } from '../useEventListener'
import { useLatest } from '../useLatest'
import { type BasicTarget, getTargetElement } from '../utils/domTarget'
import type { EventType, UseClickOutside } from './interface'

const listerOptions = {
  passive: true,
}

export const useClickOutside: UseClickOutside = (
  target: BasicTarget<Element>,
  handler: (evt: EventType) => void,
  enabled = true,
): void => {
  const savedHandler = useLatest(handler)

  const listener = (event: EventType) => {
    if (!enabled) {
      return
    }
    const element = getTargetElement(target)
    if (!element) {
      return
    }

    const elements = event.composedPath()
    if (element === event.target || elements.includes(element)) {
      return
    }

    savedHandler.current(event)
  }

  useEventListener('mousedown', listener, defaultWindow, listerOptions)
  useEventListener('touchstart', listener, defaultWindow, listerOptions)
}
