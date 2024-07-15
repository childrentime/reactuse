import type { UseScrollOptions } from '../useScroll/interface'
import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useInfiniteScroll
 */
export type UseInfiniteScroll = (
  /**
   * @zh dom元素
   * @en dom element
   */
  target: BasicTarget<Element>,
  /**
   * @zh 加载更多函数
   * @en load more function
   */
  onLoadMore: UseInfiniteScrollLoadMore,
  /**
   * @zh 可选参数
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
   * @defaultValue 0
   */
  distance?: number

  /**
   * @en The direction in which to listen the scroll.
   * @zh 滚动方向
   * @defaultValue 'bottom'
   */
  direction?: 'top' | 'bottom' | 'left' | 'right'

  /**
   * @en Whether to preserve the current scroll position when loading more items.
   * @zh 加载更多项目时是否保留当前滚动位置
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
   */
  left: boolean
  /**
   * @en arrived right
   * @zh 到达右边
   */
  right: boolean
  /**
   * @en arrived top
   * @zh 到达顶部
   */
  top: boolean
  /**
   * @en arrived bottom
   * @zh 到达底部
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
   */
  left: boolean
  /**
   * @en scroll right
   * @zh 向右滚动
   */
  right: boolean
  /**
   * @en scroll top
   * @zh 向上滚动
   */
  top: boolean
  /**
   * @en scroll bottom
   * @zh 向下滚动
   */
  bottom: boolean
}
