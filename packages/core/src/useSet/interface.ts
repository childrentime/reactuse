/**
 * @title useSet
 * @returns_en A stateful Set with manipulation methods
 * @returns_zh 一个带有操作方法的有状态 Set
 * @returns_zh-Hant 一個帶有操作方法的有狀態 Set
 */
export interface UseSetActions<T> {
  /**
   * @en Add a value to the set
   * @zh 向集合中添加一个值
   * @zh-Hant 向集合中添加一個值
   */
  add: (value: T) => void;
  /**
   * @en Remove a value from the set
   * @zh 从集合中移除一个值
   * @zh-Hant 從集合中移除一個值
   */
  remove: (value: T) => void;
  /**
   * @en Toggle a value in the set (add if missing, remove if present)
   * @zh 切换集合中的一个值（不存在则添加，存在则移除）
   * @zh-Hant 切換集合中的一個值（不存在則添加，存在則移除）
   */
  toggle: (value: T) => void;
  /**
   * @en Check if the set contains a value
   * @zh 检查集合是否包含某个值
   * @zh-Hant 檢查集合是否包含某個值
   */
  has: (value: T) => boolean;
  /**
   * @en Clear all values from the set
   * @zh 清除集合中的所有值
   * @zh-Hant 清除集合中的所有值
   */
  clear: () => void;
  /**
   * @en Reset the set to its initial values
   * @zh 将集合重置为初始值
   * @zh-Hant 將集合重置為初始值
   */
  reset: () => void;
}

export type UseSet = <T>(initialValues?: Iterable<T>) => readonly [Set<T>, UseSetActions<T>];
