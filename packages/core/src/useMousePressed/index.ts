import { useCallback, useEffect, useState } from 'react'
import { useEventListener } from '../useEventListener'
import { defaultOptions } from '../utils/defaults'
import { getTargetElement } from '../utils/domTarget'
import { useStableTarget } from '../utils/useStableTarget'
import type { UseMousePressed, UseMousePressedOptions, UseMousePressedSourceType } from './interface'

const listenerOptions = { passive: true }

export const useMousePressed: UseMousePressed = (
  target?,
  options: UseMousePressedOptions = defaultOptions,
): readonly [boolean, UseMousePressedSourceType] => {
  const { touch = true, drag = true, initialValue = false } = options

  const [pressed, setPressed] = useState(initialValue)
  const [sourceType, setSourceType] = useState<UseMousePressedSourceType>(null)
  const { key: elementKey, ref: elementRef } = useStableTarget(target)

  // One reference per handler: removeEventListener matches on the callback, so a
  // curried `onPressed('mouse')` built a different function for the add and the
  // remove and detached neither.
  const onMousePressed = useCallback(() => {
    setPressed(true)
    setSourceType('mouse')
  }, [])
  const onTouchPressed = useCallback(() => {
    setPressed(true)
    setSourceType('touch')
  }, [])
  const onReleased = useCallback(() => {
    setPressed(false)
    setSourceType(null)
  }, [])

  useEventListener('mousedown', onMousePressed, target, listenerOptions)
  useEventListener('mouseleave', onReleased, () => window, listenerOptions)
  useEventListener('mouseup', onReleased, () => window, listenerOptions)

  useEffect(() => {
    // Resolved here rather than during render: a ref handed to a child is still
    // null while rendering, and the effect would never run again to pick it up.
    const element = getTargetElement(elementRef.current)
    if (!element) {
      return
    }

    if (drag) {
      element.addEventListener('dragstart', onMousePressed, listenerOptions)
      element.addEventListener('drop', onReleased, listenerOptions)
      element.addEventListener('dragend', onReleased, listenerOptions)
    }

    if (touch) {
      element.addEventListener('touchstart', onTouchPressed, listenerOptions)
      element.addEventListener('touchend', onReleased, listenerOptions)
      element.addEventListener('touchcancel', onReleased, listenerOptions)
    }

    return () => {
      if (drag) {
        element.removeEventListener('dragstart', onMousePressed)
        element.removeEventListener('drop', onReleased)
        element.removeEventListener('dragend', onReleased)
      }
      if (touch) {
        element.removeEventListener('touchstart', onTouchPressed)
        element.removeEventListener('touchend', onReleased)
        element.removeEventListener('touchcancel', onReleased)
      }
    }
  }, [drag, touch, elementKey, elementRef, onMousePressed, onTouchPressed, onReleased])

  return [pressed, sourceType] as const
}
