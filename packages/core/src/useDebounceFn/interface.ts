import type { DebounceSettings, DebouncedFunc } from "lodash";

/**
 * @title useDebounceFn
 * @returns @en A object with the following elements:
 * - run: exec function.
 * - cancel: cancel exec function.
 * - flush:  immediately exec function
 * @returns @zh 具有以下元素的对象:
 * - run：执行函数。
 * - cancel：取消执行函数。
 * - flush: 立即执行函数
 */
export type UseDebounceFn = <T extends (...args: any) => any>(
  /**
   * @zh 要防抖的函数
   * @en debounce function
   */
  fn: T,
  /**
   * @zh 间隔时间
   * @en wait time
   */
  wait?: number,
  /**
   * @zh 传递给 `lodash.debounce` 的属性
   * @en options passed to `lodash.debounce`
   */
  options?: DebounceSettings
) => {
  run: DebouncedFunc<(...args_0: Parameters<T>) => ReturnType<T>>;
  cancel: () => void;
  flush;
};
