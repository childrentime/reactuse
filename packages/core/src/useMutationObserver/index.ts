import { useCallback, useRef } from 'react'
import { useLatest } from '../useLatest'
import { defaultOptions } from '../utils/defaults'
import { useDeepCompareEffect } from '../useDeepCompareEffect'
import { type BasicTarget, getTargetElement } from '../utils/domTarget'
import { useStableTarget } from '../utils/useStableTarget'
import type { UseMutationObserver } from './interface'

export const useMutationObserver: UseMutationObserver = (
  callback: MutationCallback,
  target: BasicTarget,
  options: MutationObserverInit = defaultOptions,
): (() => void) => {
  const callbackRef = useLatest(callback)
  const observerRef = useRef<MutationObserver>()
  const { key: targetKey, ref: targetRef } = useStableTarget(target)

  const stop = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
  }, [])

  useDeepCompareEffect(() => {
    const element = getTargetElement(targetRef.current)
    if (!element) {
      return
    }
    observerRef.current = new MutationObserver(callbackRef.current)

    observerRef.current.observe(element, options)
    return stop
  }, [targetKey, options])

  return stop
}
