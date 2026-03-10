/**
 * @title useList
 * @returns_en A stateful array with manipulation methods
 * @returns_zh 一个带有操作方法的有状态数组
 * @returns_zh-Hant 一個帶有操作方法的有狀態陣列
 */
export interface UseListActions<T> {
  /**
   * @en Set the entire list
   * @zh 设置整个列表
   * @zh-Hant 設置整個列表
   */
  set: (list: T[]) => void;
  /**
   * @en Push items to the end
   * @zh 向末尾添加项目
   * @zh-Hant 向末尾添加項目
   */
  push: (...items: T[]) => void;
  /**
   * @en Remove item at index
   * @zh 移除指定索引的项目
   * @zh-Hant 移除指定索引的項目
   */
  removeAt: (index: number) => void;
  /**
   * @en Insert item at index
   * @zh 在指定索引处插入项目
   * @zh-Hant 在指定索引處插入項目
   */
  insertAt: (index: number, item: T) => void;
  /**
   * @en Update item at index
   * @zh 更新指定索引的项目
   * @zh-Hant 更新指定索引的項目
   */
  updateAt: (index: number, item: T) => void;
  /**
   * @en Clear the list
   * @zh 清空列表
   * @zh-Hant 清空列表
   */
  clear: () => void;
  /**
   * @en Reset list to initial values
   * @zh 重置列表为初始值
   * @zh-Hant 重置列表為初始值
   */
  reset: () => void;
  /**
   * @en Filter list items
   * @zh 过滤列表项目
   * @zh-Hant 過濾列表項目
   */
  filter: (fn: (item: T, index: number) => boolean) => void;
  /**
   * @en Sort the list
   * @zh 排序列表
   * @zh-Hant 排序列表
   */
  sort: (fn?: (a: T, b: T) => number) => void;
}

export type UseList = <T>(initialList?: T[]) => readonly [T[], UseListActions<T>];
