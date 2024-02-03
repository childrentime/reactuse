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
 */
export type UseCycleList = <T>(
  /**
   * @zh 循环数组
   * @en cycle array
   */
  list: T[],
  /**
   * @zh 数组索引
   * @en array index
   */
  i?: number
) => readonly [T, (i?: number) => void, (i?: number) => void];
