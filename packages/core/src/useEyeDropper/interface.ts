/**
 * @title useEyeDropper
 * @returns 包含以下元素的元组：
 * - 浏览器是否支持该特性。
 * - 打开颜色选择器的函数。
 * @returns_en A tuple with the following elements:
 * - Whether the browser supports this feature.
 * - A function to open eye dropper.
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
