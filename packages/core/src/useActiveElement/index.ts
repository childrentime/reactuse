import { useCallback, useState } from 'react'
import { useEventListener } from '../useEventListener'
import { useMount } from '../useMount'
import { defaultWindow } from '../utils/browser'
import type { UseActiveElement } from './interface'

export const useActiveElement: UseActiveElement = <T extends Element>(): T | null => {
  const [active, setActive] = useState<T | null>(null)

  const listener = useCallback(() => {
    setActive(window?.document.activeElement as T)
  }, [])
  useEventListener('blur', listener, defaultWindow, true)
  useEventListener('focus', listener, defaultWindow, true)

  useMount(() => {
    setActive(window?.document.activeElement as T)
  })

  return active
}
