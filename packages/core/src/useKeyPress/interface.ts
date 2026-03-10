/**
 * @title useKeyPress
 * @returns_en Whether the specified key is currently pressed
 * @returns_zh 指定的键是否当前被按下
 * @returns_zh-Hant 指定的鍵是否當前被按下
 */
export interface UseKeyPressOptions {
  /**
   * @en The event target to listen to
   * @zh 要监听的事件目标
   * @zh-Hant 要監聽的事件目標
   * @defaultValue window
   */
  target?: EventTarget | null
  /**
   * @en Event types to listen for
   * @zh 要监听的事件类型
   * @zh-Hant 要監聽的事件類型
   * @defaultValue ['keydown', 'keyup']
   */
  events?: ('keydown' | 'keyup')[]
}

export type KeyFilter = string | string[] | ((event: KeyboardEvent) => boolean)

export type UseKeyPress = (key: KeyFilter, options?: UseKeyPressOptions) => boolean
