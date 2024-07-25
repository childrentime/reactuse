import { useCallback, useEffect, useRef, useState } from 'react'
import { useSupported } from '../useSupported'
import type { UseElementByPoint } from './interface'

export const useElementByPoint: UseElementByPoint = options => {
  const {
    x,
    y,
    document: doc = typeof document !== 'undefined' ? document : null,
    multiple = false,
    interval = 'requestAnimationFrame',
    immediate = true,
  } = options

  const isSupported = useSupported(() => {
    if (multiple)
      return doc && 'elementsFromPoint' in doc
    return doc && 'elementFromPoint' in doc
  })

  const [element, setElement] = useState<any>(null)
  const [isActive, setIsActive] = useState(immediate)
  const rafIdRef = useRef<number | null>(null)
  const intervalIdRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const getXY = useCallback(
    () => {
      // 需要判断 NaN
      const currentX = typeof x === 'function' ? x() : x
      const currentY = typeof y === 'function' ? y() : y
      return { x: Number.isNaN(currentX) ? 0 : currentX, y: Number.isNaN(currentY) ? 0 : currentY }
    },
    [x, y],
  )

  const cb = useCallback(() => {
    const { x: currentX, y: currentY } = getXY()
    setElement(
      multiple
        ? doc?.elementsFromPoint(currentX, currentY) ?? []
        : doc?.elementFromPoint(currentX, currentY) ?? null,
    )
  }, [doc, multiple, getXY])

  const cleanup = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current)
      intervalIdRef.current = null
    }
  }, [])
  const pause = useCallback(() => {
    setIsActive(false)
    cleanup()
  }, [cleanup])

  const resume = useCallback(() => {
    setIsActive(true)
  }, [])

  useEffect(() => {
    if (!isActive) {
      return
    }
    if (interval === 'requestAnimationFrame') {
      const runRaf = () => {
        cb()
        rafIdRef.current = requestAnimationFrame(runRaf)
      }
      runRaf()
    }
    else {
      cb()
      intervalIdRef.current = setInterval(cb, interval)
    }

    return cleanup
  }, [isActive, interval, cb, cleanup])

  useEffect(() => {
    if (immediate) {
      resume()
    }
    return pause
  }, [immediate, resume, pause])

  return {
    isSupported,
    element,
    pause,
    resume,
    isActive,
  } as const
}
