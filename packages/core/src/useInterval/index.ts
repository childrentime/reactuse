import { useEffect, useRef } from 'react'
import { useEvent } from '../useEvent'
import { useLatest } from '../useLatest'
import { useUnmount } from '../useUnmount'
import { defaultOptions } from '../utils/defaults'
import type { UseInterval } from './interface'

export const useInterval: UseInterval = (
  callback: () => void,
  delay?: number | null,
  options: {
    immediate?: boolean
    controls?: boolean
  } = defaultOptions,
) => {
  const { immediate, controls } = options
  const savedCallback = useLatest(callback)
  const isActive = useRef<boolean>(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const clean = () => {
    if (timer.current) {
      clearInterval(timer.current)
      timer.current = null
    }
  }

  const resume = useEvent(() => {
    // Drop a running timer first — otherwise its id is overwritten below and
    // neither pause() nor unmount can reach it again.
    clean()
    isActive.current = true
    timer.current = setInterval(() => savedCallback.current(), delay || 0)
  })

  const pause = useEvent(() => {
    isActive.current = false
    clean()
  })

  useEffect(() => {
    // `delay === null` means "paused" — an immediate call while paused would
    // fire the callback exactly when the caller asked for silence.
    if (immediate && delay !== null) {
      savedCallback.current()
    }
    if (controls) {
      return
    }
    if (delay !== null) {
      resume()
      return () => {
        clean()
      }
    }

    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, immediate])

  // The effect above bails out before registering a cleanup when `controls` is
  // set, so a timer started by resume() would outlive the component. Clear it on
  // unmount whichever mode the hook runs in.
  useUnmount(clean)

  return {
    isActive,
    pause,
    resume,
  }
}
