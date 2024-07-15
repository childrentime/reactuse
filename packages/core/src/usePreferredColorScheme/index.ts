import { useMediaQuery } from '../useMediaQuery'
import type { ColorScheme, UsePreferredColorScheme } from './interface'

export const usePreferredColorScheme: UsePreferredColorScheme = (
  defaultState: ColorScheme = 'no-preference',
): ColorScheme => {
  const isLight = useMediaQuery('(prefers-color-scheme: light)', false)
  const isDark = useMediaQuery('(prefers-color-scheme: dark)', false)

  return isDark ? 'dark' : isLight ? 'light' : defaultState
}
