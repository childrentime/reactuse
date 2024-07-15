import { useMediaQuery } from '../useMediaQuery'

export function useReducedMotion(defaultState?: boolean) {
  return useMediaQuery('(prefers-reduced-motion: reduce)', defaultState)
}
