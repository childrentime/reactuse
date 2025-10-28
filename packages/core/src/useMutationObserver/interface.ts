import type { BasicTarget } from '../utils/domTarget'

/**
 * @title UseMutationObserver
 * @returns 停止函数
 * @returns_en stop listenering function
 * @returns_zh-Hant 停止函數
 * @returns_ru функция остановки прослушивания
 */
export type UseMutationObserver = (
  /**
   * @zh 回调
   * @zh-Hant 回調
   * @ru обратный вызов
   * @en callback
   */
  callback: MutationCallback,
  /**
   * @zh dom元素
   * @zh-Hant dom元素
   * @ru dom элемент
   * @en dom对象
   */
  target: BasicTarget,
  /**
   * @zh 传递给 `MutationObserver` 的参数
   * @ru параметры, передаваемые в `MutationObserver`
   * @en options passed to `MutationObserver`
   */
  options?: MutationObserverInit
) => () => void
