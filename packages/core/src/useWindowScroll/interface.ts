/**
 * @title useWindowScroll
 * @returns {UseWindowScrollState}
 */
export type UseWindowScroll = () => UseWindowScrollState

/**
 * @title useWindowScrollState
 */
export interface UseWindowScrollState {
  /**
   * @zh 水平滚动的像素值
   * @zh-Hant 水平滚動的像素值
   * @en pixel value of horizontal scrolling
   */
  x: number
  /**
   * @zh 垂直滚动的像素值
   * @zh-Hant 垂直滚動的像素值
   * @en pixel value of vertical scrolling
   */
  y: number
}
