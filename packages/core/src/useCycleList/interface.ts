/**
 * @title useCycleList
 * @returns_en A tuple with the following elements:
 * - The current index value of the list.
 * - A function to set index to prev.
 * - A function to set index to next.
 *  @returns 包含以下元素的元组：
 * - 数组中当前的索引对象值
 * - 设置索引为前一个的函数
 * - 设置索引为后一个的函数
 * @returns_zh-Hant 包含以下元素的元組：
 * - 陣列中當前的索引對象值
 * - 設定索引為前一個的函數
 * - 設定索引為後一個的函數
 * @returns_ru Кортеж со следующими элементами:
 * - Текущее значение объекта по индексу в массиве
 * - Функция для установки индекса на предыдущий
 * - Функция для установки индекса на следующий
 */
export type UseCycleList = <T>(
  /**
   * @zh 循环数组
   * @zh-Hant 循環陣列
   * @ru циклический массив
   * @en cycle array
   */
  list: T[],
  /**
   * @zh 数组索引
   * @zh-Hant 陣列索引
   * @ru индекс массива
   * @en array index
   */
  i?: number
) => readonly [T, (i?: number) => void, (i?: number) => void]
