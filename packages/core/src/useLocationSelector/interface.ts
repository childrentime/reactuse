/**
 * @title useLocationSelector
 */
export type UseLocationSelector = <R>(
  /**
   * @zh 选择器
   * @zh-Hant 選擇器
   * @en selector function
   */
  selector: (location: Location) => R,
  /**
   * @zh 默认值
   * @zh-Hant 預設值
   * @en default value
   */
  fallback?: R | undefined
) => R | undefined
