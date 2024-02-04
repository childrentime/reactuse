/**
 * @title useInterval
 */
export type UseInterval = (
  /**
   * @zh 回调
   * @en callback
   */
  callback: () => void,
  /**
   * @zh 时间，如果为 `null` 的话则停止计时器
   * @en Time, if `null` then stop the timer
   */
  delay?: number | null,
  /**
   * @zh 可选参数
   * @en optional params
   */
  options?: UseIntervalOptions
) => void;

/**
 * @title UseIntervalOptions
 */
export interface UseIntervalOptions {
  /**
   * @zh 是否立即执行。
   * @en Whether to execute immediately.
   */
  immediate?: boolean;
}
