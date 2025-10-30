import type { BasicTarget } from '../utils/domTarget'

/**
 * @title UseScratchState
 */
export interface UseScratchState {
  /**
   * @zh 是否正在刮擦
   * @zh-Hant 是否正在刮擦
   * @en Whether scratching is in progress
   */
  isScratching: boolean
  /**
   * @zh 开始时间戳
   * @zh-Hant 開始時間戳
   * @en Start timestamp
   */
  start?: number
  /**
   * @zh 结束时间戳
   * @zh-Hant 結束時間戳
   * @en End timestamp
   */
  end?: number
  /**
   * @zh 相对于元素的 x 坐标
   * @zh-Hant 相對於元素的 x 座標
   * @en x coordinate relative to element
   */
  x?: number
  /**
   * @zh 相对于元素的 y 坐标
   * @zh-Hant 相對於元素的 y 座標
   * @en y coordinate relative to element
   */
  y?: number
  /**
   * @zh x 方向的增量
   * @zh-Hant x 方向的增量
   * @en Delta in x direction
   */
  dx?: number
  /**
   * @zh y 方向的增量
   * @zh-Hant y 方向的增量
   * @en Delta in y direction
   */
  dy?: number
  /**
   * @zh 文档中的 x 坐标
   * @zh-Hant 文檔中的 x 座標
   * @en x coordinate in document
   */
  docX?: number
  /**
   * @zh 文档中的 y 坐标
   * @zh-Hant 文檔中的 y 座標
   * @en y coordinate in document
   */
  docY?: number
  /**
   * @zh 元素在文档中的 x 位置
   * @zh-Hant 元素在文檔中的 x 位置
   * @en Element x position in document
   */
  posX?: number
  /**
   * @zh 元素在文档中的 y 位置
   * @zh-Hant 元素在文檔中的 y 位置
   * @en Element y position in document
   */
  posY?: number
  /**
   * @zh 元素高度
   * @zh-Hant 元素高度
   * @en Element height
   */
  elH?: number
  /**
   * @zh 元素宽度
   * @zh-Hant 元素寬度
   * @en Element width
   */
  elW?: number
  /**
   * @zh 元素 x 位置
   * @zh-Hant 元素 x 位置
   * @en Element x position
   */
  elX?: number
  /**
   * @zh 元素 y 位置
   * @zh-Hant 元素 y 位置
   * @en Element y position
   */
  elY?: number
}

/**
 * @title UseScratchOptions
 */
export interface UseScratchOptions {
  /**
   * @zh 是否禁用
   * @zh-Hant 是否禁用
   * @en Whether to disable
   * @default false
   */
  disabled?: boolean
  /**
   * @zh 刮擦时的回调
   * @zh-Hant 刮擦時的回調
   * @en Callback during scratching
   */
  onScratch?: (state: UseScratchState) => void
  /**
   * @zh 开始刮擦时的回调
   * @zh-Hant 開始刮擦時的回調
   * @en Callback when scratching starts
   */
  onScratchStart?: (state: UseScratchState) => void
  /**
   * @zh 结束刮擦时的回调
   * @zh-Hant 結束刮擦時的回調
   * @en Callback when scratching ends
   */
  onScratchEnd?: (state: UseScratchState) => void
}

/**
 * @title useScratch
 * @returns 刮擦状态
 * @returns_en Scratch state
 * @returns_zh-Hant 刮擦狀態
 */
export type UseScratch = (
  /**
   * @zh 目标元素
   * @zh-Hant 目標元素
   * @en Target element
   */
  target: BasicTarget<HTMLElement>,
  /**
   * @zh 配置项
   * @zh-Hant 配置項
   * @en Options
   */
  options?: UseScratchOptions
) => UseScratchState
