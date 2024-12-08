import type { DependencyList, EffectCallback } from 'react'
import { useEffect, useRef } from 'react'
import { useIsomorphicLayoutEffect } from '../useIsomorphicLayoutEffect'
import { useUpdate } from '../useUpdate'
import type { DepsEqualFnType, UseCustomCompareEffect } from './interface'

export const useCustomCompareEffect: UseCustomCompareEffect = <TDeps extends DependencyList>(
  effect: EffectCallback,
  deps: TDeps,
  depsEqual: DepsEqualFnType<TDeps>,
): void => {
  if (process.env.NODE_ENV !== 'production') {
    if (!(Array.isArray(deps)) || !deps.length) {
      console.warn(
        '`useCustomCompareEffect` should not be used with no dependencies. Use React.useEffect instead.',
      )
    }

    if (typeof depsEqual !== 'function') {
      console.warn(
        '`useCustomCompareEffect` should be used with depsEqual callback for comparing deps list',
      )
    }
  }

  const ref = useRef<TDeps | undefined>(undefined)
  const forceUpdate = useUpdate()

  if (!ref.current) {
    ref.current = deps
  }

  useIsomorphicLayoutEffect(() => {
    if (!depsEqual(deps, ref.current as TDeps)) {
      console.log('deps', deps, ref.current)
      ref.current = deps
      forceUpdate()
    }
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, ref.current)
}
