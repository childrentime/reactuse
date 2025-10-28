import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useElementBounding
 */

export type UseElementBounding = (
  /**
   * @zh 目标元素
   * @zh-Hant 目標元素
   * @ru целевой элемент
   * @en target element
   */
  target: BasicTarget<Element>,
  /**
   * @zh 可选参数
   * @zh-Hant 可選參數
   * @ru опциональные параметры
   * @en optional params
   */
  options?: UseElementBoundingOptions
) => UseElementBoundingReturn

/**
 * @title UseElementBoundingOptions
 */
export interface UseElementBoundingOptions {
  /**
   * @en Reset values to 0 on component unmounted
   * @zh 将数值重置为0
   * @ru сбросить значения до 0 при размонтировании компонента
   * @defaultValue true
   */
  reset?: boolean

  /**
   * @en Listen to window resize event
   * @zh 是否监听 resize 事件
   * @ru прослушивать событие изменения размера окна
   * @defaultValue true
   */
  windowResize?: boolean
  /**
   * @en Listen to window scroll event
   * @zh 是否监听 scroll 事件
   * @ru прослушивать событие прокрутки окна
   * @defaultValue true
   */
  windowScroll?: boolean

  /**
   * @en Immediately call update on component mounted
   * @zh 立即更新
   * @ru немедленно вызвать обновление при монтировании компонента
   * @default true
   */
  immediate?: boolean
}

/**
 * @title UseElementBoundingReturn
 */
export interface UseElementBoundingReturn {
  /**
   * @en Height of the element
   * @zh 元素的高度
   * @ru высота элемента
   */
  readonly height: number

  /**
   * @en Bottom position of the element
   * @zh 元素的底部位置
   * @ru нижняя позиция элемента
   */
  readonly bottom: number

  /**
   * @en Left position of the element
   * @zh 元素的左侧位置
   * @ru левая позиция элемента
   */
  readonly left: number

  /**
   * @en Right position of the element
   * @zh 元素的右侧位置
   * @ru правая позиция элемента
   */
  readonly right: number

  /**
   * @en Top position of the element
   * @zh 元素的顶部位置
   * @ru верхняя позиция элемента
   */
  readonly top: number

  /**
   * @en Width of the element
   * @zh 元素的宽度
   * @ru ширина элемента
   */
  readonly width: number

  /**
   * @en X position of the element
   * @zh 元素的 X 位置
   * @ru X позиция элемента
   */
  readonly x: number

  /**
   * @en Y position of the element
   * @zh 元素的 Y 位置
   * @ru Y позиция элемента
   */
  readonly y: number

  /**
   * @en Manual update
   * @zh 手动更新
   * @ru ручное обновление
   */
  readonly update: () => void
}
