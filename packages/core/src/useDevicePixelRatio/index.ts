import { useCallback, useEffect, useState } from 'react'
import type { UseDevicePixelRatio } from './interface'

export const useDevicePixelRatio: UseDevicePixelRatio = () => {
  const [pixelRatio, setPixelRatio] = useState<number>(1)

  const observe = useCallback(() => {
    if (!window)
      return

    setPixelRatio(window.devicePixelRatio)

    const media = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)

    const handleChange = () => {
      observe()
    }

    media.addEventListener('change', handleChange, { once: true })

    return () => {
      media.removeEventListener('change', handleChange)
    }
  }, [])

  useEffect(() => {
    const cleanup = observe()
    return cleanup
  }, [observe])

  return { pixelRatio } as const
}
