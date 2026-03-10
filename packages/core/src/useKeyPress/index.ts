import { useEffect, useState } from 'react'
import { useLatest } from '../useLatest'
import { isBrowser } from '../utils/is'
import type { KeyFilter, UseKeyPress } from './interface'

function matchKey(event: KeyboardEvent, keyFilter: KeyFilter): boolean {
  if (typeof keyFilter === 'function') {
    return keyFilter(event)
  }
  if (typeof keyFilter === 'string') {
    return event.key === keyFilter || event.code === keyFilter
  }
  if (Array.isArray(keyFilter)) {
    return keyFilter.some(k => event.key === k || event.code === k)
  }
  return false
}

export const useKeyPress: UseKeyPress = (key, options = {}) => {
  const [pressed, setPressed] = useState(false)
  const keyRef = useLatest(key)
  const { target, events = ['keydown', 'keyup'] } = options
  const eventsRef = useLatest(events)

  useEffect(() => {
    if (!isBrowser)
      return

    const el = target ?? window
    const currentEvents = eventsRef.current

    const handleKeyDown = (e: Event) => {
      if (matchKey(e as KeyboardEvent, keyRef.current)) {
        setPressed(true)
      }
    }

    const handleKeyUp = (e: Event) => {
      if (matchKey(e as KeyboardEvent, keyRef.current)) {
        setPressed(false)
      }
    }

    if (currentEvents.includes('keydown')) {
      el.addEventListener('keydown', handleKeyDown)
    }
    if (currentEvents.includes('keyup')) {
      el.addEventListener('keyup', handleKeyUp)
    }

    return () => {
      if (currentEvents.includes('keydown')) {
        el.removeEventListener('keydown', handleKeyDown)
      }
      if (currentEvents.includes('keyup')) {
        el.removeEventListener('keyup', handleKeyUp)
      }
    }
  }, [target, eventsRef, keyRef])

  return pressed
}
