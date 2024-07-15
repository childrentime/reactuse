import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useMouse
 * @returns 鼠标位置
 * @returns_en Mouse Position
 */
export type UseMouse = (
  /**
   * @zh dom元素
   * @en dom element
   */
  target?: BasicTarget
) => UseMouseCursorState

/**
 * @title UseMouseCursorState
 */
export interface UseMouseCursorState {
  screenX: number
  screenY: number
  clientX: number
  clientY: number
  pageX: number
  pageY: number
  elementX: number
  elementY: number
  elementH: number
  elementW: number
  elementPosX: number
  elementPosY: number
}
