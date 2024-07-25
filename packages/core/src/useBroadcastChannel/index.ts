import { useCallback, useEffect, useRef, useState } from 'react'
import { useSupported } from '../useSupported'
import type {
  UseBroadcastChannel,
  UseBroadcastChannelOptions,
} from './interface'

export const useBroadcastChannel: UseBroadcastChannel = <D, P>(
  options: UseBroadcastChannelOptions,
) => {
  const { name } = options
  const isSupported = useSupported(
    () => window && 'BroadcastChannel' in window,
  )

  const [isClosed, setIsClosed] = useState<boolean>(false)
  const [data, setData] = useState<D | undefined>()
  const [error, setError] = useState<Event | null>(null)
  const [timeStamp, setTimeStamp] = useState<number>(0)

  const channelRef = useRef<BroadcastChannel | undefined>()

  const post = useCallback((data: P) => {
    if (channelRef.current) {
      channelRef.current.postMessage(data)
    }
  }, [])

  const close = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.close()
    }
    setIsClosed(true)
  }, [])

  useEffect(() => {
    if (isSupported) {
      channelRef.current = new BroadcastChannel(name)
      setError(null)

      const handleMessage = (e: MessageEvent) => {
        setData(e.data)
        // avoid data is same between two messages
        setTimeStamp(Date.now())
      }

      const handleError = (e: MessageEvent) => {
        setError(e)
      }

      const handleClose = () => {
        setIsClosed(true)
      }

      channelRef.current.addEventListener('message', handleMessage, {
        passive: true,
      })
      channelRef.current.addEventListener('messageerror', handleError, {
        passive: true,
      })
      channelRef.current.addEventListener('close', handleClose)

      return () => {
        if (channelRef.current) {
          channelRef.current.removeEventListener('message', handleMessage)
          channelRef.current.removeEventListener('messageerror', handleError)
          channelRef.current.removeEventListener('close', handleClose)
          close()
        }
      }
    }

    return close
  }, [isSupported, name, close])

  return {
    isSupported,
    channel: channelRef.current,
    data,
    post,
    close,
    error,
    isClosed,
    timeStamp,
  } as const
}
