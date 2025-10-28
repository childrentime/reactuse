/**
 * @title useCountdown
 * @returns_en A tuple with the following elements:
 * - hour
 * - minute.
 * - second.
 * @returns 包含以下元素的元组：
 * - 小时。
 * - 分钟。
 * - 秒数。
 * @returns_zh-Hant 包含以下元素的元組：
 * - 小時。
 * - 分鐘。
 * - 秒數。
 * @returns_ru Кортеж со следующими элементами:
 * - часы.
 * - минуты.
 * - секунды.
 */
export type UseCountDown = (
  /**
   * @zh 时间差
   * @zh-Hant 時間差
   * @ru разница во времени
   * @en time differ
   */
  time: number,
  /**
   * @zh 时间格式化函数
   * @zh-Hant 時間格式化函數
   * @ru функция форматирования времени
   * @en time format function
   * @defaultValue HH MM SS
   */
  format?: (num: number) => [string, string, string],
  /**
   * @zh 倒计时结束的回调函数
   * @zh-Hant 倒計時結束的回調函數
   * @ru функция обратного вызова при завершении обратного отсчета
   * @en callback function for end of countdown
   */
  callback?: () => void
) => readonly [string, string, string]
