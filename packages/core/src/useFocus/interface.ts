import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useFocus
 * @returns 包含以下元素的元组：
 * - 元素是否聚焦。
 * - 更新聚焦状态。
 * @returns_en A tuple with the following elements:
 * -  whether the element focus.
 * - A function to update focus state.
 * @returns_zh-Hant 包含以下元素的元組：
 * - 元素是否聚焦。
 * - 更新聚焦狀態。
 * @returns_ru Кортеж со следующими элементами:
 * - находится ли элемент в фокусе.
 * - функция для обновления состояния фокуса.
 */
export type UseFocus = (
  /**
   * @zh dom对象
   * @zh-Hant dom對象
   * @ru dom элемент
   * @en dom element
   */
  target: BasicTarget<HTMLElement | SVGElement>,
  /**
   * @zh 默认值
   * @zh-Hant 預設值
   * @ru значение по умолчанию
   * @en defaultValue
   * @defaultValue false
   */
  initialValue?: boolean
) => readonly [boolean, (value: boolean) => void]
