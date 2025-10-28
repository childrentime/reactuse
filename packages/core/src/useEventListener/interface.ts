/**
 * @title useEventListener
 */
export type UseEventListener = (
  /**
   * @zh 事件名称
   * @zh-Hant 事件名稱
   * @ru название события
   * @en event name
   */
  eventName: string,
  /**
   * @zh 事件处理器
   * @zh-Hant 事件處理器
   * @ru обработчик события
   * @en event handler
   */
  handler: (event: any) => void,
  /**
   * @zh dom元素
   * @ru dom элемент
   * @en dom element
   * @defaultValue `window`
   */
  element?:
    | HTMLElement
    | Element
    | Window
    | Document
    | EventTarget
    | null
    | undefined,
  /**
   * @zh 监听选项
   * @ru параметры прослушивателя
   * @en listener options
   */
  options?: boolean | AddEventListenerOptions | undefined
) => void
