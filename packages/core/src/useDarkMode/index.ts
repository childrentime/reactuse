import { useCallback } from 'react'
import { isBrowser } from '../utils/is'
import { useColorMode } from '../useColorMode'
import type { UseDarkMode, UseDarkOptions } from './interface'

function getSystemPreference(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useDarkMode: UseDarkMode = (options: UseDarkOptions) => {
  const {
    selector = 'html',
    attribute = 'class',
    classNameDark = '',
    classNameLight = '',
    storageKey = 'reactuses-color-scheme',
    storage = () => (isBrowser ? localStorage : undefined),
    defaultValue = false,
  } = options

  // Convert boolean-based options to string-based options for useColorMode
  const [colorMode, setColorMode] = useColorMode({
    selector,
    attribute,
    modes: ['light', 'dark'],
    defaultValue: defaultValue ? 'dark' : 'light',
    storageKey,
    storage,
    initialValueDetector: getSystemPreference,
    modeClassNames: {
      dark: classNameDark,
      light: classNameLight,
    },
  })

  // Convert string mode back to boolean
  const dark = colorMode === 'dark'

  // Toggle function that switches between dark and light
  const toggle = useCallback(() => {
    setColorMode(dark ? 'light' : 'dark')
  }, [dark, setColorMode])

  // Set function that accepts boolean value
  const setDark = useCallback((value: React.SetStateAction<boolean | null>) => {
    if (typeof value === 'function') {
      const currentDark = colorMode === 'dark'
      const newDark = value(currentDark)
      if (newDark !== null) {
        setColorMode(newDark ? 'dark' : 'light')
      }
    }
    else if (value !== null) {
      setColorMode(value ? 'dark' : 'light')
    }
  }, [colorMode, setColorMode])

  return [dark, toggle, setDark] as const
}
