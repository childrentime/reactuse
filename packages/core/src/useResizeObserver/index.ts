import { useCallback, useRef } from 'react'
import { useLatest } from '../useLatest'
import { defaultOptions } from '../utils/defaults'
import { useDeepCompareEffect } from '../useDeepCompareEffect'
import { getTargetElement } from '../utils/domTarget'
import type { UseResizeObserver } from './interface'

export const useResizeObserver: UseResizeObserver = (
  target,
  callback: ResizeObserverCallback,
  options: ResizeObserverOptions = defaultOptions,
): () => void => {
  const savedCallback = useLatest(callback)
  const observerRef = useRef<ResizeObserver>()

  const stop = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
  }, [])
  useDeepCompareEffect(() => {
    const element = getTargetElement(target)
    if (!element) {
      return
    }
    observerRef.current = new ResizeObserver(savedCallback.current)
    observerRef.current.observe(element, options)

    return stop
  }, [savedCallback, stop, target, options])

  return stop
}
