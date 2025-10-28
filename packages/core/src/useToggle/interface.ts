/**
 * @title useToggle
 * @returns 包含以下元素的元组：
 * - 布尔状态的当前值。
 * - 切换布尔状态值的函数。
 * @returns_en A tuple with the following elements:
 * - The current value of the bool state.
 * - A function to update the value of the bool state.
 * @returns_zh-Hant 包含以下元素的元組：
 * - 布林狀態的當前值。
 * - 切換布林狀態值的函數。
 * @returns_ru Кортеж со следующими элементами:
 * - Текущее значение булева состояния.
 * - Функция для переключения булева состояния.
 */
export type UseToggle = (
  /**
   * @zh 初始值
   * @zh-Hant 初始值
   * @ru Начальное значение
   * @en initialValue
   */
  initialValue: boolean
) => [boolean, (nextValue?: any) => void]
