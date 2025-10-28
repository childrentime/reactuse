/**
 * @title useControlledState
 * @returns_en A tuple with the following elements:
 * - The current value.
 * - A function to update the value.
 * @returns 包含以下元素的元组：
 * - 当前值。
 * - 更新当前值的函数。
 * @returns_zh-Hant 包含以下元素的元組：
 * - 當前值。
 * - 更新當前值的函數。
 * @returns_ru Кортеж со следующими элементами:
 * - Текущее значение.
 * - Функция для обновления значения.
 */
export type UseControlled = <T>(
  /**
   * @en controlled value
   * @zh 受控值
   * @zh-Hant 受控值
   * @ru контролируемое значение
   */
  value: T | undefined,
  /**
   * @en default value
   * @zh 默认值
   * @zh-Hant 預設值
   * @ru значение по умолчанию
   */
  defaultValue: T,
  /**
   * @en callback when value change
   * @zh 值改变时的回调
   * @zh-Hant 值改變時的回調
   * @ru обратный вызов при изменении значения
   */
  onChange?: ((v: T, ...args: any[]) => void) | undefined
) => [T, (value: T) => void]
