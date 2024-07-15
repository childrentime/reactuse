/**
 * @title useSetState
 * @returns 包含以下元素的元组：
 * - state 的当前值。
 * - 更新 state 值的函数。
 * @returns_en A tuple with the following elements:
 * - The current value of the state.
 * - A function to update the value of the state.
 */
export type UseSetState = <T extends Record<string, any>>(
  /**
   * @zh 初始值
   * @en initial value
   */
  initialState: T
) => readonly [
  T,
  (statePartial: Partial<T> | ((currentState: T) => Partial<T>)) => void,
]
