import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useMousePressed
 * @returns 包含以下元素的元组：
 * - 鼠标是否按下。
 * - 按下的事件来源。
 * @returns_en A tuple with the following elements:
 * - whether the mouse is pressed.
 * - the pressed source type
 * @returns_zh-Hant 包含以下元素的元組：
 * - 滑鼠是否按下。
 * - 按下的事件來源。
 * @returns_ru Кортеж со следующими элементами:
 * - нажата ли мышь.
 * - источник события нажатия.
 */
export type UseMousePressed = (
  /**
   * @zh dom对象
   * @zh-Hant dom對象
   * @ru dom элемент
   * @en dom element
   */
  target?: BasicTarget<Element>,
  /**
   * @zh 可选参数
   * @ru опциональные параметры
   * @en optional params
   */
  options?: UseMousePressedOptions
) => readonly [boolean, UseMousePressedSourceType]

/**
 * @title UseMousePressedOptions
 */
export interface UseMousePressedOptions {
  /**
   * @en Listen to `touchstart` `touchend` events
   * @zh 监听 `touchstart` 事件
   * @ru прослушивать события `touchstart` `touchend`
   * @defaultValue true
   */
  touch?: boolean

  /**
   * @en Listen to `dragstart` `drop` and `dragend` events
   * @zh 监听 `dragStart` 事件
   * @ru прослушивать события `dragstart` `drop` и `dragend`
   * @defaultValue true
   */
  drag?: boolean

  /**
   * @en Initial values
   * @zh 初始值
   * @ru начальные значения
   * @defaultValue false
   */
  initialValue?: boolean | (() => boolean)
}

/**
 * @title UseMousePressedSourceType
 */
export type UseMousePressedSourceType = 'mouse' | 'touch' | null
