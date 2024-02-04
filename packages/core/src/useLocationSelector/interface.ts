/**
 * @title useLocationSelector
 */
export type UseLocationSelector = <R>(
  /**
   * @zh 选择器
   * @en selector function
   */
  selector: (location: Location) => R,
  /**
   * @zh 默认值
   * @en default value
   */
  fallback?: R | undefined
) => R | undefined;
