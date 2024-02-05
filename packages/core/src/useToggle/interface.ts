/**
 * @title useToggle
 * @returns 包含以下元素的元组：
 * - 布尔状态的当前值。
 * - 切换布尔状态值的函数。
 * @returns_en A tuple with the following elements:
 * - The current value of the bool state.
 * - A function to update the value of the bool state.
 */
export type UseToggle = (
  /**
   * @zh 初始值
   * @en initialValue
   */
  initialValue: boolean
) => [boolean, (nextValue?: any) => void];
