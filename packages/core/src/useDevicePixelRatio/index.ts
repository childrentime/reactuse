import { useEffect, useState } from 'react'
import type { UseDevicePixelRatio } from './interface'

export const useDevicePixelRatio: UseDevicePixelRatio = () => {
  const [pixelRatio, setPixelRatio] = useState<number>(1)

  useEffect(() => {
    // Each ratio carries its own media query, so `observe` re-subscribes on
    // every change and hands the effect the cleanup for the live subscription.
    let cleanup: (() => void) | undefined

    const observe = () => {
      setPixelRatio(window.devicePixelRatio)

      const media = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)

      const handleChange = () => {
        observe()
      }

      media.addEventListener('change', handleChange, { once: true })

      cleanup = () => {
        media.removeEventListener('change', handleChange)
      }
    }

    observe()

    return () => {
      cleanup?.()
    }
  }, [])

  return { pixelRatio } as const
}
