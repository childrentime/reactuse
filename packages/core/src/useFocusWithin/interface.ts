import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useFocusWithin
 * @returns_en Whether focus is within the target element
 * @returns_zh 焦点是否在目标元素内
 * @returns_zh-Hant 焦點是否在目標元素內
 */
export interface UseFocusWithinOptions {
  /**
   * @en Callback when focus enters the element
   * @zh 焦点进入元素时的回调
   * @zh-Hant 焦點進入元素時的回調
   */
  onFocus?: (event: FocusEvent) => void
  /**
   * @en Callback when focus leaves the element
   * @zh 焦点离开元素时的回调
   * @zh-Hant 焦點離開元素時的回調
   */
  onBlur?: (event: FocusEvent) => void
}

export type UseFocusWithin = (target: BasicTarget<HTMLElement>, options?: UseFocusWithinOptions) => boolean
