/**
 * @title useWindowSize
 * @returns_en A object with the following elements:
 * - width: The current window width.
 * - height: The current window height.
 * @returns 包含以下元素的对象：
 * - width：当前视窗宽度。
 * - height： 当前视窗高度。
 */
export type UseWindowSize = () => {
  readonly width: number
  readonly height: number
}
