import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useDoubleClick
 */
export type UseDoubleClick = (props: UseDoubleClickProps) => void

/**
 * @title UseDoubleClickProps
 */
export interface UseDoubleClickProps {
  /**
   * @zh dom对象
   * @zh-Hant dom對象
   * @ru dom элемент
   * @en dom element
   */
  target: BasicTarget<Element>

  /**
   * @zh 延迟时间（毫秒）
   * @zh-Hant 延遲時間（毫秒）
   * @ru время задержки (миллисекунды)
   * @en latency time (milliseconds)
   */
  latency?: number | undefined

  /**
   * @zh 单击事件处理函数
   * @zh-Hant 單擊事件處理函數
   * @ru обработчик события одинарного клика
   * @en single click event handler
   */
  onSingleClick?: ((e?: MouseEvent | TouchEvent) => void) | undefined

  /**
   * @zh 双击事件处理函数
   * @zh-Hant 雙擊事件處理函數
   * @ru обработчик события двойного клика
   * @en double click event handler
   */
  onDoubleClick?: ((e?: MouseEvent | TouchEvent) => void) | undefined
}
