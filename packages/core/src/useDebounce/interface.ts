import type { DebounceSettings } from "lodash-es";

/**
 * @title useDebounce
 */
export type UseDebounce = <T>(
  /**
   * @zh 要防抖的值
   * @en the value need to debounce
   */
  value: T,
  /**
   * @zh 间隔时间
   * @en wait time
   */
  wait?: number,
  /**
   * @zh 传递给 `lodash.debounce` 的选项
   * @en options passed to `lodash.debounce`
   */
  options?: DebounceSettings
) => T;
