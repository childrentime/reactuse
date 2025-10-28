import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useElementVisibility
 * @returns 包含以下元素的元组：
 * - 当前元素是否可见。
 * - 停止监听函数。
 * @returns_en A tuple with the following elements:
 * - is the current element visible.
 * - stop observer listening function.
 * @returns_zh-Hant 包含以下元素的元組：
 * - 當前元素是否可見。
 * - 停止監聽函數。
 * @returns_ru Кортеж со следующими элементами:
 * - виден ли текущий элемент.
 * - функция остановки прослушивания.
 */
export type UseElementVisibility = (
/**
 * @zh dom对象
 * @zh-Hant dom對象
 * @ru dom элемент
 * @en dom element
 */
  target: BasicTarget<HTMLElement | SVGElement>,
/**
 * @zh 传递给 `intersectionObserver` 的选项
 * @zh-Hant 傳遞給 `intersectionObserver` 的選項
 * @ru параметры, передаваемые в `intersectionObserver`
 * @en options passed to `intersectionObserver`
 */
  options?: IntersectionObserverInit
) => readonly [boolean, () => void]
