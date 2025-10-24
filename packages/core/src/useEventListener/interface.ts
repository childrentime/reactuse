/**
 * @title useEventListener
 */
export type UseEventListener = (
  /**
   * @zh 事件名称
   * @zh-Hant 事件名稱
   * @en event name
   */
  eventName: string,
  /**
   * @zh 事件处理器
   * @zh-Hant 事件處理器
   * @en event handler
   */
  handler: (event: any) => void,
  /**
   * @zh dom元素
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
   * @en listener options
   */
  options?: boolean | AddEventListenerOptions | undefined
) => void
