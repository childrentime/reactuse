import { useEffect, useState } from 'react'
import { useLatest } from '../useLatest'
import { getTargetElement } from '../utils/domTarget'
import type { UseFocusWithin } from './interface'

export const useFocusWithin: UseFocusWithin = (target, options = {}) => {
  const [focused, setFocused] = useState(false)
  const optionsRef = useLatest(options)

  useEffect(() => {
    const el = getTargetElement(target)
    if (!el)
      return

    const handleFocusIn = (event: FocusEvent) => {
      if (!focused) {
        setFocused(true)
        optionsRef.current.onFocus?.(event)
      }
    }

    const handleFocusOut = (event: FocusEvent) => {
      // Check if the new focus target is still within the element
      if (el && !el.contains(event.relatedTarget as Node)) {
        setFocused(false)
        optionsRef.current.onBlur?.(event)
      }
    }

    el.addEventListener('focusin', handleFocusIn as EventListener)
    el.addEventListener('focusout', handleFocusOut as EventListener)

    return () => {
      el.removeEventListener('focusin', handleFocusIn as EventListener)
      el.removeEventListener('focusout', handleFocusOut as EventListener)
    }
  }, [target])

  return focused
}
