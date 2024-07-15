import type { DependencyList, EffectCallback } from 'react'

/**
 * @title useDeepCompareEffect
 */
export type UseDeepCompareEffect = (
  /**
   * @zh 副作用函数
   * @en effect function
   */
  effect: EffectCallback,
  /**
   * @zh 依赖列表
   * @en dep list
   */
  deps: DependencyList
) => void
