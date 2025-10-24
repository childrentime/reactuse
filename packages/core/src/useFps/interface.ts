/**
 * @title useFps
 * @returns 每秒帧数
 * @returns_en frames per second
 * @returns_zh-Hant 每秒幀數
 */
export type UseFps = (options?: UseFpsOptions) => number

/**
 * @title UseFpsOptions
 */
export interface UseFpsOptions {
  /**
   * @en Calculate the FPS on every x frames.
   * @zh 每过 x 帧计算一次
   * @zh-Hant 每過 x 幀計算一次
   * @defaultValue 10
   */
  every?: number
}
