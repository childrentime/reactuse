import { useCallback } from 'react'
import { isBrowser } from '../utils/is'
import useStorage from '../createStorage'
import { useDeepCompareEffect } from '../useDeepCompareEffect'
import { useEvent } from '../useEvent'
import { useLatest } from '../useLatest'
import type { UseColorMode, UseColorModeOptions } from './interface'

export const useColorMode: UseColorMode = <T extends string = string>(
  options: UseColorModeOptions<T>,
) => {
  const {
    selector = 'html',
    attribute = 'class',
    modes,
    defaultValue,
    storageKey = 'reactuses-color-mode',
    storage = () => (isBrowser ? localStorage : undefined),
    initialValueDetector,
    modeClassNames = {},
  } = options
  const initialValueDetectorRef = useLatest(initialValueDetector)

  // Validate modes array
  if (!modes || modes.length === 0) {
    throw new Error('useColorMode: modes array cannot be empty')
  }

  // Get initial value from detector or use first mode as fallback
  const getInitialValue = useCallback((): T => {
    if (initialValueDetectorRef.current) {
      const initialValueDetector = initialValueDetectorRef.current
      try {
        const detectedValue = initialValueDetector()
        return modes.includes(detectedValue) ? detectedValue : modes[0]
      }
      catch {
        return modes[0]
      }
    }
    return defaultValue && modes.includes(defaultValue) ? defaultValue : modes[0]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue, JSON.stringify(modes)])

  const [colorMode, setColorMode] = useStorage<T>(
    storageKey,
    defaultValue,
    storage,
    {
      mountStorageValue: getInitialValue,
    },
  )

  // Apply color mode to DOM element
  useDeepCompareEffect(() => {
    if (!colorMode)
      return

    const element = window?.document.querySelector(selector)
    if (!element)
      return

    // Remove all existing mode classes/attributes
    modes.forEach(mode => {
      const className = (modeClassNames as Record<string, string>)[mode] || mode
      if (attribute === 'class') {
        element.classList.remove(className)
      }
      else {
        element.removeAttribute(attribute)
      }
    })

    // Apply current mode class/attribute
    const currentClassName = (modeClassNames as Record<string, string>)[colorMode] || colorMode
    if (attribute === 'class') {
      element.classList.add(currentClassName)
    }
    else {
      element.setAttribute(attribute, currentClassName)
    }

    return () => {
      // Cleanup: remove current mode class/attribute
      if (attribute === 'class') {
        element.classList.remove(currentClassName)
      }
      else {
        element.removeAttribute(attribute)
      }
    }
  }, [colorMode, selector, attribute, modes, modeClassNames])

  const cycle = useEvent(() => {
    if (!colorMode)
      return
    const currentIndex = modes.indexOf(colorMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setColorMode(modes[nextIndex])
  })

  return [colorMode, setColorMode, cycle] as const
}

export type { UseColorMode, UseColorModeOptions } from './interface'
