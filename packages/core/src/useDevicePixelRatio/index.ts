import { useCallback, useEffect, useRef, useState } from 'react'
import type { UseDevicePixelRatio } from './interface'

export const useDevicePixelRatio: UseDevicePixelRatio = () => {
  const [pixelRatio, setPixelRatio] = useState<number>(1)
  // `observe` re-subscribes to a new media query every time the ratio changes,
  // so the effect cannot hold the cleanup for the current subscription itself.
  const cleanupRef = useRef<(() => void) | undefined>(undefined)

  const observe = useCallback(() => {
    if (!window)
      return

    setPixelRatio(window.devicePixelRatio)

    const media = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)

    const handleChange = () => {
      observe()
    }

    media.addEventListener('change', handleChange, { once: true })

    cleanupRef.current = () => {
      media.removeEventListener('change', handleChange)
    }
  }, [])

  useEffect(() => {
    observe()
    return () => {
      cleanupRef.current?.()
    }
  }, [observe])

  return { pixelRatio } as const
}
