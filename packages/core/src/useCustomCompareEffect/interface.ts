import type { DependencyList, EffectCallback } from "react";

export type DepsEqualFnType<TDeps extends DependencyList> = (
  prevDeps: TDeps,
  nextDeps: TDeps
) => boolean;

/**
 * @title useCustomCompareEffect
 */
export type UseCustomCompareEffectType = <TDeps extends DependencyList>(
  /**
   * @zh 副作用函数
   * @en effect callback
   */
  effect: EffectCallback,
  /**
   * @zh 依赖列表
   * @en deps
   */
  deps: TDeps,
  /**
   * @zh 依赖比较函数
   * @en deps compare function
   */
  depsEqual: DepsEqualFnType<TDeps>
) => void;
