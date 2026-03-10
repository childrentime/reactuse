import { useEffect, useRef, useState } from 'react'
import { useLatest } from '../useLatest'
import { getTargetElement } from '../utils/domTarget'
import type { UseFocusWithin } from './interface'

export const useFocusWithin: UseFocusWithin = (target, options = {}) => {
  const [focused, setFocused] = useState(false)
  const focusedRef = useRef(false)
  const optionsRef = useLatest(options)

  useEffect(() => {
    const el = getTargetElement(target)
    if (!el)
      return

    const handleFocusIn = (event: FocusEvent) => {
      if (!focusedRef.current) {
        focusedRef.current = true
        setFocused(true)
        optionsRef.current.onFocus?.(event)
      }
    }

    const handleFocusOut = (event: FocusEvent) => {
      // Check if the new focus target is still within the element
      if (el && !el.contains(event.relatedTarget as Node)) {
        focusedRef.current = false
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
  }, [target, optionsRef])

  return focused
}
