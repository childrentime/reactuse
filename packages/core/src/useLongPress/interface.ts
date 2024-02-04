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
 */
export type UseLongPress = (
  /**
   * @zh 回调
   * @en callback
   */
  callback: (e: TouchEvent | MouseEvent) => void,
  /**
   * @zh 可选参数
   * @en optional params
   */
  options?: UseLongPressOptions
) => {
  readonly onMouseDown: (e: any) => void;
  readonly onTouchStart: (e: any) => void;
  readonly onMouseUp: () => void;
  readonly onMouseLeave: () => void;
  readonly onTouchEnd: () => void;
};

/**
 * @title UseLongPressOptions
 */
export interface UseLongPressOptions {
  /**
   * @zh 阻止默认事件
   * @en whether prevent default event
   * @defaultValue true
   */
  isPreventDefault?: boolean;
  /**
   * @zh 延迟
   * @en delay time
   * @defaultValue 300
   */
  delay?: number;
}
