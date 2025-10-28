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
 * @returns_zh-Hant 包含以下屬性的物件：
 * - value: 當前的布林值。
 * - setValue: 直接設定布林值的函數。
 * - setTrue: 將值設定為 true 的函數。
 * - setFalse: 將值設定為 false 的函數。
 * - toggle: 切換布林值的函數。
 * @returns_ru Объект со следующими свойствами:
 * - value: Текущее булево значение.
 * - setValue: Функция для прямого установки булева значения.
 * - setTrue: Функция для установки значения в true.
 * - setFalse: Функция для установки значения в false.
 * - toggle: Функция для переключения булева значения.
 */
export type UseBoolean = (
  /**
   * @zh 初始值，默认为 false
   * @zh-Hant 初始值，預設為 false
   * @ru Начальное булево значение. По умолчанию false.
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
