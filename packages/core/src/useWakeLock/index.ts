import { useEffect, useRef, useState } from 'react'
import { useSupported } from '../useSupported'
import { useEvent } from '../useEvent'
import type { UseWakeLock, UseWakeLockOptions } from './interface'

export const useWakeLock: UseWakeLock = (options: UseWakeLockOptions = {}) => {
  const { onRequest, onRelease, onError } = options

  const isSupported = useSupported(() => 'wakeLock' in navigator)
  const [isActive, setIsActive] = useState(false)
  const sentinelRef = useRef<WakeLockSentinel | null>(null)
  const requestedTypeRef = useRef<WakeLockType | false>(false)

  const forceRequest = useEvent(async () => {
    if (!isSupported)
      return
    try {
      await sentinelRef.current?.release()
      const sentinel = await navigator.wakeLock.request('screen')
      sentinelRef.current = sentinel
      setIsActive(true)
      sentinel.addEventListener('release', () => {
        requestedTypeRef.current = sentinelRef.current?.type ?? false
        sentinelRef.current = null
        setIsActive(false)
        onRelease?.()
      }, { once: true })
      onRequest?.()
    }
    catch (error) {
      onError?.(error as Error)
    }
  })

  const request = useEvent(async () => {
    if (!isSupported)
      return
    if (document.visibilityState === 'visible') {
      await forceRequest()
    }
    else {
      requestedTypeRef.current = 'screen'
    }
  })

  const release = useEvent(async () => {
    requestedTypeRef.current = false
    const s = sentinelRef.current
    sentinelRef.current = null
    setIsActive(false)
    try {
      await s?.release()
    }
    catch (error) {
      onError?.(error as Error)
    }
  })

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && requestedTypeRef.current) {
        requestedTypeRef.current = false
        forceRequest()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [forceRequest])

  useEffect(() => {
    return () => {
      requestedTypeRef.current = false
      if (sentinelRef.current) {
        sentinelRef.current.release()
        sentinelRef.current = null
      }
    }
  }, [])

  return {
    isSupported,
    isActive,
    request,
    release,
    forceRequest,
  }
}
