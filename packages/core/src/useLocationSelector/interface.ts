/**
 * @title useLocationSelector
 */
export type UseLocationSelector = <R>(
  /**
   * @zh 选择器
   * @zh-Hant 選擇器
   * @ru функция-селектор
   * @en selector function
   */
  selector: (location: Location) => R,
  /**
   * @zh 默认值
   * @zh-Hant 預設值
   * @ru значение по умолчанию
   * @en default value
   */
  fallback?: R | undefined
) => R | undefined
