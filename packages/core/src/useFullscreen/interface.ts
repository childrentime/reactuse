import type { BasicTarget } from '../utils/domTarget'

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
 * @returns_zh-Hant 包含以下元素的元組：
 * - 當前是否處於全螢幕。
 * - 一個操作對象:
 * - enterFullscreen： 進入全螢幕。
 * - exitFullscreen： 退出全螢幕。
 * - toggleFullscreen： 切換全螢幕。
 * - isEnabled： 當前瀏覽器是否支援全螢幕。
 * @returns_ru Кортеж со следующими элементами:
 * - находится ли браузер в полноэкранном режиме.
 * - объект с операциями:
 * - enterFullscreen: войти в полноэкранный режим.
 * - exitFullscreen: выйти из полноэкранного режима.
 * - toggleFullscreen: переключить полноэкранный режим.
 * - isEnabled: поддерживает ли браузер полноэкранный режим.
 */
export type UseFullscreen = (
  /**
   * @zh dom元素
   * @zh-Hant dom元素
   * @ru dom элемент
   * @en dom element
   */
  target: BasicTarget<Element>,
  /**
   * @zh 可选参数
   * @ru опциональные параметры
   * @en optional params
   */
  options?: UseFullScreenOptions
) => readonly [
  /**
   * @zh 当前是否处于全屏
   * @ru находится ли в полноэкранном режиме
   * @en whether is in fullscreen
   */
  boolean,
  {
    /**
     * @zh 进入全屏
     * @ru войти в полноэкранный режим
     * @en enter fullscreen
     */
    readonly enterFullscreen: () => void
    /**
     * @zh 退出全屏
     * @ru выйти из полноэкранного режима
     * @en exit fullscreen
     */
    readonly exitFullscreen: () => void
    /**
     * @zh 切换全屏
     * @ru переключить полноэкранный режим
     * @en toggle fullscreen
     */
    readonly toggleFullscreen: () => void
    /**
     * @zh 浏览器是否支持
     * @ru поддерживает ли браузер полноэкранный режим
     * @en whether the browser support fullscreen
     */
    readonly isEnabled: boolean
  },
]

/**
 * @title UseFullScreenOptions
 */
export interface UseFullScreenOptions {
  /**
   * @zh 退出时候的回调
   * @ru обратный вызов при выходе
   * @en exit callback
   */
  onExit?: () => void
  /**
   * @zh 进入时候的回调
   * @ru обратный вызов при входе
   * @en enter callback
   */
  onEnter?: () => void
}
