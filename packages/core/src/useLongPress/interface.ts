/**
 * @title useLongPress
 * @returns 包含以下元素的对象：
 * - onMouseDown 鼠标按下事件。
 * - onTouchStart 手指按下事件。
 * - onMouseUp 鼠标松开事件。
 * - onMouseLeave 鼠标离开事件
 * - onTouchEnd 手指松开事件
 * @returns_en A object with the following elements:
 * - onMouseDown: Mouse down event.
 * - onTouchStart: Finger touch start event.
 * - onMouseUp: Mouse up event.
 * - onMouseLeave: Mouse leave event.
 * - onTouchEnd: Finger touch end event.
 * @returns_zh-Hant 包含以下元素的對象：
 * - onMouseDown 滑鼠按下事件。
 * - onTouchStart 手指按下事件。
 * - onMouseUp 滑鼠放開事件。
 * - onMouseLeave 滑鼠離開事件
 * - onTouchEnd 手指放開事件
 * @returns_ru Объект со следующими элементами:
 * - onMouseDown: событие нажатия мыши.
 * - onTouchStart: событие начала касания пальцем.
 * - onMouseUp: событие отпускания мыши.
 * - onMouseLeave: событие ухода мыши.
 * - onTouchEnd: событие окончания касания пальцем.
 */
export type UseLongPress = (
  /**
   * @zh 回调
   * @zh-Hant 回調
   * @ru обратный вызов
   * @en callback
   */
  callback: (e: TouchEvent | MouseEvent) => void,
  /**
   * @zh 可选参数
   * @zh-Hant 可選參數
   * @ru опциональные параметры
   * @en optional params
   */
  options?: UseLongPressOptions
) => {
  readonly onMouseDown: (e: any) => void
  readonly onTouchStart: (e: any) => void
  readonly onMouseUp: () => void
  readonly onMouseLeave: () => void
  readonly onTouchEnd: () => void
}

/**
 * @title UseLongPressOptions
 */
export interface UseLongPressOptions {
  /**
   * @zh 阻止默认事件
   * @zh-Hant 阻止預設事件
   * @ru предотвращать ли действие по умолчанию
   * @en whether prevent default event
   * @defaultValue true
   */
  isPreventDefault?: boolean
  /**
   * @zh 延迟
   * @zh-Hant 延遲
   * @ru время задержки
   * @en delay time
   * @defaultValue 300
   */
  delay?: number
}
