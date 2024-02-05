/**
 * @title Blink
 *
 * @zh 这是 Blink 接口描述。
 * @en This is interface description of Blink.
 *
 */
export interface BlinkProps {
  /**
   * @zh 数字
   * @en numbers
   */
  numbers: number[];
  /**
   * @zh 是否设置 flex 布局属性
   * @en Whether to set flex layout properties
   */
  flex: boolean;
  /**
   * @zh 排序属性
   * @en sorter
   */
  sorter: SorterProps;
  _privatePropThatShouldBeIgnored: ShouldBeIgnoredProps;
}

/**
 * @title Clink
 *
 * @zh 这是 Clink 接口描述。
 * @en This is interface description of Clink.
 *
 */
export interface ClinkProps {
  /**
   * @zh 排序属性
   * @en sorter
   */
  sorter: SorterProps;
}

interface SorterProps {
  counter: number;
}

export interface ShouldBeIgnoredProps {
  fail: boolean;
}
