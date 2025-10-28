import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useIntersectionObserver
 * @returns 停止监听函数
 * @returns_en stop listening function
 * @returns_zh-Hant 停止監聽函數
 * @returns_ru функция остановки прослушивания
 */
export type UseIntersectionObserver = (
  /**
   * @zh dom元素
   * @zh-Hant dom元素
   * @ru dom элемент
   * @en dom element
   */
  target: BasicTarget<Element>,
  /**
   * @zh 回调
   * @zh-Hant 回調
   * @ru обратный вызов
   * @en callback
   */
  callback: IntersectionObserverCallback,
  /**
   * @zh 传递给 `IntersectionObserver` 的参数
   * @ru параметры, передаваемые в `IntersectionObserver`
   * @en options passed to `IntersectionObserver`
   */
  options?: IntersectionObserverInit
) => () => void
