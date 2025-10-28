import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useClickOutside
 */
export type UseClickOutside = (
  /**
   * @zh dom对象
   * @zh-Hant dom對象
   * @ru dom элемент
   * @en dom element
   */
  target: BasicTarget<Element>,
  /**
   * @zh 监听函数
   * @zh-Hant 監聽函數
   * @ru функция прослушивателя
   * @en listener fucntion
   */
  handler: (evt: EventType) => void,
  /**
   * @zh 监听函数是否生效
   * @zh-Hant 監聽函數是否生效
   * @ru включена ли функция прослушивателя
   * @en whether the listener fucntion is enabled
   */
  enabled?: boolean
) => void

export type EventType = MouseEvent | TouchEvent
