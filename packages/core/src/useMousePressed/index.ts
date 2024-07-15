import { useCallback, useEffect, useState } from 'react'
import { useEventListener } from '../useEventListener'
import { defaultOptions } from '../utils/defaults'
import { getTargetElement } from '../utils/domTarget'
import type { UseMousePressed, UseMousePressedOptions, UseMousePressedSourceType } from './interface'

const listenerOptions = { passive: true }

export const useMousePressed: UseMousePressed = (
  target?,
  options: UseMousePressedOptions = defaultOptions,
): readonly [boolean, UseMousePressedSourceType] => {
  const { touch = true, drag = true, initialValue = false } = options

  const [pressed, setPressed] = useState(initialValue)
  const [sourceType, setSourceType] = useState<UseMousePressedSourceType>(null)
  const element = getTargetElement(target)

  const onPressed = useCallback(
    (srcType: UseMousePressedSourceType) => () => {
      setPressed(true)
      setSourceType(srcType)
    },
    [],
  )
  const onReleased = useCallback(() => {
    setPressed(false)
    setSourceType(null)
  }, [])

  useEventListener('mousedown', onPressed('mouse'), target, listenerOptions)
  useEventListener('mouseleave', onReleased, () => window, listenerOptions)
  useEventListener('mouseup', onReleased, () => window, listenerOptions)

  useEffect(() => {
    if (drag) {
      element?.addEventListener(
        'dragstart',
        onPressed('mouse'),
        listenerOptions,
      )
      element?.addEventListener('drop', onReleased, listenerOptions)
      element?.addEventListener('dragend', onReleased, listenerOptions)
    }

    if (touch) {
      element?.addEventListener(
        'touchstart',
        onPressed('touch'),
        listenerOptions,
      )
      element?.addEventListener('touchend', onReleased, listenerOptions)
      element?.addEventListener('touchcancel', onReleased, listenerOptions)
    }

    return () => {
      if (drag) {
        element?.removeEventListener('dragstart', onPressed('mouse'))
        element?.removeEventListener('drop', onReleased)
        element?.removeEventListener('dragend', onReleased)
      }
      if (touch) {
        element?.removeEventListener('touchstart', onPressed('touch'))
        element?.removeEventListener('touchend', onReleased)
        element?.removeEventListener('touchcancel', onReleased)
      }
    }
  }, [drag, onPressed, onReleased, touch, element])

  return [pressed, sourceType] as const
}
