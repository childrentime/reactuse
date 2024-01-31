/**
 * @title useCountdown
 * @returns A tuple with the following elements:
 * - hour
 * - minute.
 * - second.
 * @returns {zh} 包含以下元素的元组：
  * - 小时。
  * - 分钟。
  * - 秒数。
 */
export type UseCountDownType = (
  /**
   * @zh 时间差
   * @en time differ
   */
  time: number,
  /**
   * @zh 时间格式化函数
   * @en time format function
   * @defaultValue HH MM SS
   */
  format?: (num: number) => [string, string, string],
  /**
   * @zh 倒计时结束的回调函数
   * @en callback function for end of countdown
   */
  callback?: () => void
) => readonly [string, string, string];
