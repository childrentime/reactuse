import type { UseScrollOptions } from '../useScroll/interface'
import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useInfiniteScroll
 */
export type UseInfiniteScroll = (
  /**
   * @zh dom元素
   * @zh-Hant dom元素
   * @ru dom элемент
   * @en dom element
   */
  target: BasicTarget<Element>,
  /**
   * @zh 加载更多函数
   * @zh-Hant 加載更多函數
   * @ru функция загрузки дополнительных данных
   * @en load more function
   */
  onLoadMore: UseInfiniteScrollLoadMore,
  /**
   * @zh 可选参数
   * @ru опциональные параметры
   * @en optional params
   */
  options?: UseInfiniteScrollOptions
) => void

/**
 * @title UseInfiniteScrollLoadMore
 */
export type UseInfiniteScrollLoadMore = (
  /**
   * @zh `useScroll` 返回的状态
   * @ru возвращаемое состояние `useScroll`
   * @en the return state of `useScroll`
   */
  state: readonly [
    number,
    number,
    boolean,
    UseInfiniteScrollArrivedState,
    UseInfiniteScrollDirection,
  ]
) => void | Promise<void>
/**
 * @title UseInfiniteScrollOptions
 */
export interface UseInfiniteScrollOptions extends UseScrollOptions {
  /**
   * @en The minimum distance between the bottom of the element and the bottom of the viewport
   * @zh 元素底部与视口底部之间的最小距离
   * @ru минимальное расстояние между нижней частью элемента и нижней частью области просмотра
   * @defaultValue 0
   */
  distance?: number

  /**
   * @en The direction in which to listen the scroll.
   * @zh 滚动方向
   * @ru направление прослушивания прокрутки
   * @defaultValue 'bottom'
   */
  direction?: 'top' | 'bottom' | 'left' | 'right'

  /**
   * @en Whether to preserve the current scroll position when loading more items.
   * @zh 加载更多项目时是否保留当前滚动位置
   * @ru сохранять ли текущую позицию прокрутки при загрузке дополнительных элементов
   * @defaultValueValue false
   */
  preserveScrollPosition?: boolean
}

/**
 * @title UseInfiniteScrollArrivedState
 */
export interface UseInfiniteScrollArrivedState {
  /**
   * @en arrived left
   * @zh 到达左边
   * @ru достигнут левый край
   */
  left: boolean
  /**
   * @en arrived right
   * @zh 到达右边
   * @ru достигнут правый край
   */
  right: boolean
  /**
   * @en arrived top
   * @zh 到达顶部
   * @ru достигнут верхний край
   */
  top: boolean
  /**
   * @en arrived bottom
   * @zh 到达底部
   * @ru достигнут нижний край
   */
  bottom: boolean
}

/**
 * @title UseInfiniteScrollDirection
 */
export interface UseInfiniteScrollDirection {
  /**
   * @en scroll left
   * @zh 向左滚动
   * @ru прокрутка влево
   */
  left: boolean
  /**
   * @en scroll right
   * @zh 向右滚动
   * @ru прокрутка вправо
   */
  right: boolean
  /**
   * @en scroll top
   * @zh 向上滚动
   * @ru прокрутка вверх
   */
  top: boolean
  /**
   * @en scroll bottom
   * @zh 向下滚动
   * @ru прокрутка вниз
   */
  bottom: boolean
}
