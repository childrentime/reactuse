import type { DebounceSettings } from 'lodash-es'

/**
 * @title useDebounce
 */
export type UseDebounce = <T>(
  /**
   * @zh 要防抖的值
   * @zh-Hant 要防抖的值
   * @ru значение для дебаунса
   * @en the value need to debounce
   */
  value: T,
  /**
   * @zh 间隔时间
   * @zh-Hant 間隔時間
   * @ru время ожидания
   * @en wait time
   */
  wait?: number,
  /**
   * @zh 传递给 `lodash.debounce` 的选项
   * @zh-Hant 傳遞給 `lodash.debounce` 的選項
   * @ru параметры, передаваемые в `lodash.debounce`
   * @en options passed to `lodash.debounce`
   */
  options?: DebounceSettings
) => T
