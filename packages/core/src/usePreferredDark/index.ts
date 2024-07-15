import { useMediaQuery } from '../useMediaQuery'

export function usePreferredDark(defaultState?: boolean): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)', defaultState)
}
