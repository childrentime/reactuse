import type { DependencyList } from "react";

/**
 *
 * @title useAsyncEffect
 */
export type UseAsyncEffect = <T>(
   /**
   * @zh 支持promise的副作用函数
   * @en effect that support promise
   */
  effect: () => Promise<T> | T,
   /**
   * @zh 清理函数
   * @en cleanup function
   * @defaultValue () => {}
   */
  cleanup: typeof effect,
   /**
   * @zh 依赖列表
   * @en dependency list
   */
  deps?: DependencyList
) => void;
