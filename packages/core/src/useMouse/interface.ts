import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useMouse
 * @returns 鼠标位置
 * @returns_en Mouse Position
 * @returns_zh-Hant 滑鼠位置
 * @returns_ru позиция мыши
 */
export type UseMouse = (
  /**
   * @zh dom元素
   * @zh-Hant dom元素
   * @ru dom элемент
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
