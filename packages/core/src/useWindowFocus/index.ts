import { useEffect, useState } from 'react'
import { useEventListener } from '../useEventListener'

export function useWindowFocus(defaultValue = false): boolean {
  const [focused, setFocused] = useState(defaultValue)

  useEffect(() => {
    setFocused(window.document.hasFocus())
  }, [])

  useEventListener('blur', () => {
    setFocused(false)
  })

  useEventListener('focus', () => {
    setFocused(true)
  })

  return focused
}
