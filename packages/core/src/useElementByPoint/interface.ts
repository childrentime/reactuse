import type { Pausable } from '../utils/types'

/**
 * @title UseElementByPoint
 */
export type UseElementByPoint = <M extends boolean = false>(
  /**
   * @en options
   * @zh 配置项
   */
  options: UseElementByPointOptions<M>
) => UseElementByPointReturn<M>

/**
 * @title UseElementByPointOptions
 */
export interface UseElementByPointOptions<M extends boolean = false> {
  /**
   * @en The x coordinate of the point
   * @zh 点的 x 坐标
   */
  x: number | (() => number)
  /**
   * @en The y coordinate of the point
   * @zh 点的 y 坐标
   */
  y: number | (() => number)
  /**
   * @en The document to query
   * @zh 要查询的文档
   */
  document?: Document | null
  /**
   * @en Whether to query multiple elements
   * @zh 是否查询多个元素
   */
  multiple?: M
  /**
   * @en The interval to query the element
   * @zh 查询元素的间隔
   */
  interval?: number | 'requestAnimationFrame'
  /**
   * @en Whether to query the element immediately
   * @zh 是否立即查询元素
   */
  immediate?: boolean
}

/**
 * @title UseElementByPointReturn
 */
export interface UseElementByPointReturn<M extends boolean> extends Pausable {
  /**
   * @en Whether the feature is supported
   * @zh 功能是否支持
   */
  isSupported: boolean
  /**
   * @en The queried element
   * @zh 查询到的元素
   */
  element: M extends true ? Element[] : Element | null
}
