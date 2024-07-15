import { useEffect, useState } from 'react'
import { useEventListener } from '../useEventListener'

export function useWindowsFocus(defauleValue = false): boolean {
  const [focused, setFocused] = useState(defauleValue)

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
