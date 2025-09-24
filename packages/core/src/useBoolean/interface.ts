/**
 * @title useBoolean
 * @returns_en An object with the following properties:
 * - value: The current boolean value.
 * - setValue: A function to set the boolean value directly.
 * - setTrue: A function to set the value to true.
 * - setFalse: A function to set the value to false.
 * - toggle: A function to toggle the boolean value.
 * @returns 包含以下属性的对象：
 * - value: 当前的布尔值。
 * - setValue: 直接设置布尔值的函数。
 * - setTrue: 将值设置为 true 的函数。
 * - setFalse: 将值设置为 false 的函数。
 * - toggle: 切换布尔值的函数。
 */
export type UseBoolean = (
  /**
   * @zh 初始值，默认为 false
   * @en The initial boolean value. Defaults to false.
   */
  initialValue?: boolean
) => {
  readonly value: boolean
  readonly setValue: (value: boolean) => void
  readonly setTrue: () => void
  readonly setFalse: () => void
  readonly toggle: () => void
}
