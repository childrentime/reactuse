import type { ThrottleSettings } from 'lodash-es'

/**
 * @title useThrottle
 */
export type UseThrottle = <T>(
  /**
   * @zh 要节流的值
   * @zh-Hant 要節流的值
   * @ru значение для троттлинга
   * @en the value need to throttle
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
   * @zh 传递给 `lodash.throttle` 的选项
   * @ru параметры, передаваемые в `lodash.throttle`
   * @en options passed to `lodash.throttle`
   */
  options?: ThrottleSettings
) => T
