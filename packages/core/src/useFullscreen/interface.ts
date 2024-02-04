import type { RefObject } from "react";

/**
 * @title useFullScreen
 * @returns 包含以下元素的元组：
 * - 当前是否处于全屏。
 * - 一个操作对象:
 * - enterFullscreen： 进入全屏。
 * - exitFullscreen： 退出全屏。
 * - toggleFullscreen： 切换全屏。
 * - isEnabled： 当前浏览器是否支持全屏。
 * @returns_en A tuple with the following elements:
 * - whether the browser is in fullscreen.
 * - a object：
 * - enterFullscreen
 * - exitFullscreen
 * - toggleFullscreen
 * - isEnabled: whether the browser support fullscreen
 */
export type UseFullscreen = (
  /**
   * @zh dom元素
   * @en dom element
   */
  target: RefObject<Element>,
  /**
   * @zh 可选参数
   * @en optional params
   */
  options?: UseFullScreenOptions
) => readonly [
  /**
   * @zh 当前是否处于全屏
   * @en whether is in fullscreen
   */
  boolean,
  {
    /**
     * @zh 进入全屏
     * @en enter fullscreen
     */
    readonly enterFullscreen: () => void;
    /**
     * @zh 退出全屏
     * @en exit fullscreen
     */
    readonly exitFullscreen: () => void;
    /**
     * @zh 切换全屏
     * @en toggle fullscreen
     */
    readonly toggleFullscreen: () => void;
    /**
     * @zh 浏览器是否支持
     * @en whether the browser support fullscreen
     */
    readonly isEnabled: boolean;
  },
];

/**
 * @title UseFullScreenOptions
 */
export interface UseFullScreenOptions {
  /**
   * @zh 退出时候的回调
   * @en exit callback
   */
  onExit?: () => void;
  /**
   * @zh 进入时候的回调
   * @en enter callback
   */
  onEnter?: () => void;
}
