import { useEffect, useState } from 'react'
import { useIsomorphicLayoutEffect } from '../useIsomorphicLayoutEffect'

export function useSupported(callback: () => unknown, sync = false): boolean {
  const [supported, setSupported] = useState(false)

  const effect = sync ? useIsomorphicLayoutEffect : useEffect
  effect(() => {
    try {
      setSupported(Boolean(callback()))
    } catch {
      setSupported(false)
    }
  }, [])

  return supported
}
