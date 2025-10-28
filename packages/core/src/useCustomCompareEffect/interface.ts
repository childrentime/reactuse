import type { DependencyList, EffectCallback } from 'react'

export type DepsEqualFnType<TDeps extends DependencyList> = (
  prevDeps: TDeps,
  nextDeps: TDeps
) => boolean

/**
 * @title useCustomCompareEffect
 */
export type UseCustomCompareEffect = <TDeps extends DependencyList>(
  /**
   * @zh 副作用函数
   * @zh-Hant 副作用函數
   * @ru функция эффекта
   * @en effect callback
   */
  effect: EffectCallback,
  /**
   * @zh 依赖列表
   * @zh-Hant 依賴列表
   * @ru список зависимостей
   * @en deps
   */
  deps: TDeps,
  /**
   * @zh 依赖比较函数
   * @zh-Hant 依賴比較函數
   * @ru функция сравнения зависимостей
   * @en deps compare function
   */
  depsEqual: DepsEqualFnType<TDeps>
) => void
