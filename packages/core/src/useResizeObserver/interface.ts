import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useResizeObserver
 */
export type UseResizeObserver = (
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
  callback: ResizeObserverCallback,
/**
 * @zh `resizeObserver` 参数
 * @ru параметры, передаваемые в `resizeObserver`
 * @en options passed to `resizeObserver`
 */
  options?: ResizeObserverOptions
) => () => void
