import { useState } from 'react'
import { useDeepCompareEffect } from '../useDeepCompareEffect'
import { off, on } from '../utils/browser'
import { defaultOptions } from '../utils/defaults'
import type { KeyModifier, UseKeyModifier, UseModifierOptions } from './interface'

const defaultEvents: (keyof WindowEventMap)[] = [
  'mousedown',
  'mouseup',
  'keydown',
  'keyup',
]

export const useKeyModifier: UseKeyModifier = (
  modifier: KeyModifier,
  options: UseModifierOptions = defaultOptions,
): boolean => {
  const { events = defaultEvents, initial = false } = options

  const [state, setState] = useState<boolean>(initial)

  // Deep compare so an inline `events` array does not re-register on every
  // render, while a changed `modifier` or event list does.
  useDeepCompareEffect(() => {
    // One reference reaches both calls: `removeEventListener` matches on the
    // callback identity, so a freshly built arrow function detaches nothing.
    const handler = (evt: Event) => {
      const event = evt as KeyboardEvent
      if (typeof event.getModifierState === 'function') {
        setState(event.getModifierState(modifier))
      }
    }

    events.forEach(listenEvent => on(document, listenEvent, handler))

    return () => {
      events.forEach(listenEvent => off(document, listenEvent, handler))
    }
  }, [modifier, events])

  return state
}
