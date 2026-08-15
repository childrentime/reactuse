import { useCallback, useEffect, useRef, useState } from 'react'
import { useEvent } from '../useEvent'
import { defaultOptions } from '../utils/defaults'
import { useUnmount } from '../useUnmount'
import type { EventSourceStatus, UseEventSource, UseEventSourceOptions } from './interface'

export const useEventSource: UseEventSource = <Events extends string[]>(
  url: string | URL,
  events: Events = [] as unknown as Events,
  options: UseEventSourceOptions = defaultOptions,
) => {
  const [data, setData] = useState<string | null>(null)
  const [error, setError] = useState<Event | null>(null)
  const [status, setStatus] = useState<EventSourceStatus>('DISCONNECTED')
  const [event, setEvent] = useState<string | null>(null)
  const [lastEventId, setLastEventId] = useState<string | null>(null)
  const retries = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const explicitlyClosed = useRef(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const eventListenerRef = useRef<Map<string, ((event: MessageEvent<any>) => void)>>()
  if (!eventListenerRef.current) {
    eventListenerRef.current = new Map()
  }

  const clean = useEvent(() => {
    const listeners = eventListenerRef.current

    events.forEach(name => {
      const handler = listeners?.get(name)
      if (handler) {
        eventSourceRef.current?.removeEventListener(name, handler)
      }
    })
  })

  const close = useCallback((explicit: boolean = false) => {
    setStatus('DISCONNECTED')
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
    clean()
    eventSourceRef.current?.close()
    eventSourceRef.current = null
    explicitlyClosed.current = explicit
  }, [clean])

  const explicitlyClose = useCallback(() => {
    close(true)
  }, [close])

  // internal (re)connect: does NOT reset the retry counter, so
  // `autoReconnect.retries` actually caps consecutive failed attempts
  const connect = useEvent(() => {
    close()
    setStatus('CONNECTING')

    if (!eventSourceRef.current) {
      eventSourceRef.current = new EventSource(url, {
        withCredentials: options.withCredentials,
      })
    }

    const es = eventSourceRef.current

    es.onopen = () => {
      setStatus('CONNECTED')
      setError(null)
      // a successful connection resets the consecutive-failure count
      retries.current = 0
    }

    es.onmessage = ev => {
      setData(ev.data)
      setLastEventId(ev.lastEventId)
      setStatus('CONNECTED')
    }

    es.onerror = err => {
      setError(err)
      setStatus('DISCONNECTED')

      if (options.autoReconnect && !explicitlyClosed.current) {
        const {
          retries: maxRetries = -1,
          delay = 1000,
          onFailed,
        } = options.autoReconnect

        retries.current += 1

        if (
          (typeof maxRetries === 'number'
            && (maxRetries < 0 || retries.current < maxRetries))
          || (typeof maxRetries === 'function' && maxRetries())
        ) {
          reconnectTimer.current = setTimeout(connect, delay)
        }
        else {
          onFailed?.()
        }
      }
    }

    const listeners = eventListenerRef.current

    events.forEach(name => {
      const handler = (event: MessageEvent<any>) => {
        setEvent(name)
        setData(event.data ?? null)
      }
      es.addEventListener(name, handler)
      listeners?.set(name, handler)
    })
  })

  // public open: a fresh user-initiated connection starts the retry budget over
  const open = useEvent(() => {
    retries.current = 0
    connect()
  })

  useEffect(() => {
    if (options.immediate !== false) {
      open()
    }

    return close
  }, [open, close, options.immediate])

  useUnmount(() => {
    close()
  })

  return {
    eventSourceRef,
    data,
    error,
    status,
    lastEventId,
    event,
    close: explicitlyClose,
    open,
  }
}
