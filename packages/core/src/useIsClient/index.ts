import { useEffect, useState } from 'react'
import type { UseIsClient } from './interface'

export const useIsClient: UseIsClient = () => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}
