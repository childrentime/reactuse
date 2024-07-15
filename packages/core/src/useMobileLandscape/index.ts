import { useEffect, useState } from 'react'
import { useOrientation } from '../useOrientation'

export function useMobileLandscape() {
  const [isMobileLandscape, setIsMobileLandscape] = useState(false)
  const [orientation] = useOrientation()

  useEffect(() => {
    const userAgent = window.navigator.userAgent
    const isMobile = /Mobi|Android｜iphone/i.test(userAgent)
    setIsMobileLandscape(isMobile && orientation.type === 'landscape-primary')
  }, [orientation.type])

  return isMobileLandscape
}
