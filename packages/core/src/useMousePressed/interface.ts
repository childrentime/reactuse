import type { BasicTarget } from "../utils/domTarget";

/**
 * @title useMousePressed
 * @returns 包含以下元素的元组：
 * - 鼠标是否按下。
 * - 按下的事件来源。
 * @returns_en A tuple with the following elements:
 * - whether the mouse is pressed.
 * - the pressed source type
 */
export type UseMousePressed = (
  /**
   * @zh dom对象
   * @en dom element
   */
  target?: BasicTarget<Element>,
  /**
   * @zh 可选参数
   * @en optional params
   */
  options?: UseMousePressedOptions
) => readonly [boolean, UseMousePressedSourceType];

/**
 * @title UseMousePressedOptions
 */
export interface UseMousePressedOptions {
  /**
   * @en Listen to `touchstart` `touchend` events
   * @zh 监听 `touchstart` 事件
   * @defaultValue true
   */
  touch?: boolean;

  /**
   * @en Listen to `dragstart` `drop` and `dragend` events
   * @zh 监听 `dragStart` 事件
   * @defaultValue true
   */
  drag?: boolean;

  /**
   * @en Initial values
   * @zh 初始值
   * @defaultValue false
   */
  initialValue?: boolean | (() => boolean);
}

/**
 * @title UseMousePressedSourceType
 */
export type UseMousePressedSourceType = "mouse" | "touch" | null;
