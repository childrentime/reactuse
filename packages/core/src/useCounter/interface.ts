/**
 * @title useCounter
 * @returns_en A tuple with the following elements:
 * - The current value of the counter.
 * - A function to set the state of the counter. It can accept a number or a function that returns a number.
 * - A function to increment the counter. It optionally accepts a number to increment the counter by, defaulting to 1.
 * - A function to decrement the counter. It optionally accepts a number to decrement the counter by, defaulting to 1.
 * - A function to reset the counter to its initial value.
 *  @returns 包含以下元素的元组：
 * - 计数器的当前值。
 * - 设置计数器状态的函数。 它可以接受数字或返回数字的函数。
 * - 递增计数器的函数。 它可以选择接受一个数字来增加计数器，默认为 1。
 * - 递减计数器的函数。 它可以选择接受一个数字来减少计数器，默认为 1。
 * - 将计数器重置为其初始值的函数。
 */
export type UseCounter = (
  /**
   * @zh 初始值，可以为数字或者一个初始化的函数
   * @en The initial value of the counter. It can be a number or a function that returns a number. If not provided, the counter will start from 0.
   * @defaultValue 0
   */
  initialValue?: number | (() => number),
  /**
   * @zh 最大值。不提供则无上限
   * @en The maximum value that the counter can reach. If not provided or null, there is no upper limit.
   */
  max?: number | null,
  /**
   * @zh 最小值。不提供则无下限
   * @en The minimum value that the counter can reach. If not provided or null, there is no lower limit.
   */
  min?: number | null
) => readonly [
  number,
  (newState: number | ((prev: number) => number) | (() => number)) => void,
  (delta?: number) => void,
  (delta?: number) => void,
  () => void,
];
