import { isEqual } from 'lodash-es'
import type { DependencyList, EffectCallback } from 'react'
import { useCustomCompareEffect } from '../useCustomCompareEffect'
import type { UseDeepCompareEffect } from './interface'

export const useDeepCompareEffect: UseDeepCompareEffect = (
  effect: EffectCallback,
  deps: DependencyList,
): void => {
  if (process.env.NODE_ENV !== 'production') {
    if (!Array.isArray(deps) || !deps.length) {
      console.warn(
        '`useDeepCompareEffect` should not be used with no dependencies. Use React.useEffect instead.',
      )
    }
  }

  useCustomCompareEffect(effect, deps, isEqual)
}
