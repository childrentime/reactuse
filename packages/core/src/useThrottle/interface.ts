import type { ThrottleSettings } from 'lodash-es'

/**
 * @title useThrottle
 */
export type UseThrottle = <T>(
  /**
   * @zh 要节流的值
   * @en the value need to throttle
   */
  value: T,
  /**
   * @zh 间隔时间
   * @en wait time
   */
  wait?: number,
  /**
   * @zh 传递给 `lodash.throttle` 的选项
   * @en options passed to `lodash.throttle`
   */
  options?: ThrottleSettings
) => T
