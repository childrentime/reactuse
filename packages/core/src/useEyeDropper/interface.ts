/**
 * @title useEyeDropper
 * @returns 包含以下元素的元组：
 * - 浏览器是否支持该特性。
 * - 打开颜色选择器的函数。
 * @returns_en A tuple with the following elements:
 * - Whether the browser supports this feature.
 * - A function to open eye dropper.
 * @returns_zh-Hant 包含以下元素的元組：
 * - 瀏覽器是否支援該特性。
 * - 打開顏色選擇器的函數。
 */
export type UseEyeDropper = () => readonly [
  boolean,
  (options?: UseEyeDropperOpenOptions) => Promise<UseEyeDropperOpenReturnType>,
]

/**
 * @title UseEyeDropperOpenOptions
 */
export interface UseEyeDropperOpenOptions {
  /**
   * @zh 终止信号
   * @zh-Hant 終止信號
   * @en abort signal
   */
  signal?: AbortSignal
}

/**
 * @title UseEyeDropperOpenReturnType
 */
export interface UseEyeDropperOpenReturnType {
  /**
   * @zh rgb 颜色值
   * @en rgb color value
   */
  sRGBHex: string
}
