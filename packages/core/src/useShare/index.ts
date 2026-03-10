import { useCallback } from 'react'
import { useSupported } from '../useSupported'
import type { UseShare, UseShareData } from './interface'

export const useShare: UseShare = initialData => {
  const isSupported = useSupported(() => typeof navigator !== 'undefined' && 'share' in navigator)

  const share = useCallback(async (data?: UseShareData) => {
    if (!isSupported) {
      throw new Error('Web Share API is not supported')
    }
    const shareData = data ?? initialData
    if (!shareData) {
      throw new Error('No share data provided')
    }
    await navigator.share(shareData)
  }, [isSupported, initialData])

  return { isSupported, share }
}
