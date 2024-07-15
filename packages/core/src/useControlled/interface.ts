/**
 * @title useControlledState
 * @returns_en A tuple with the following elements:
 * - The current value.
 * - A function to update the value.
 * @returns 包含以下元素的元组：
 * - 当前值。
 * - 更新当前值的函数。
 */
export type UseControlled = <T>(
  /**
   * @en controlled value
   * @zh 受控值
   */
  value: T | undefined,
  /**
   * @en default value
   * @zh 默认值
   */
  defaultValue: T,
  /**
   * @en callback when value change
   * @zh 值改变时的回调
   */
  onChange?: ((v: T, ...args: any[]) => void) | undefined
) => [T, (value: T) => void]
