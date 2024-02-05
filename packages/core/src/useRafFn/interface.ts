/**
 * @title useRafFn
 * @returns 包含以下元素的元组：
 * - 停止函数。
 * - 开始函数。
 * - 函数是否在执行中。
 * @returns_en A tuple with the following elements:
 * - stop function
 * - start function
 * whether function is running
 */
export type UseRafFn = (
  /**
   * @zh 回调
   * @en callback
   */
  callback: FrameRequestCallback,
  /**
   * @zh 立即执行
   * @en immediatly start
   */
  initiallyActive?: boolean
) => readonly [() => void, () => void, () => boolean];
