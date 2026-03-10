import { useEffect, useState } from 'react'
import type { UseMouseWheel } from './interface'

export const useMouseWheel: UseMouseWheel = () => {
  const [deltaY, setDeltaY] = useState(0)

  useEffect(() => {
    const handler = (event: WheelEvent) => {
      setDeltaY(prev => prev + event.deltaY)
    }

    window.addEventListener('wheel', handler, { passive: true })
    return () => window.removeEventListener('wheel', handler)
  }, [])

  return deltaY
}
