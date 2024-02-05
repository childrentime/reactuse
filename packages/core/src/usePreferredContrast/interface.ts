/**
 * @title usePreferredContrast
 */
export type UsePreferredContrast = (
  /**
   * @zh 默认值
   * @en default value
   * @defaultValue no-preference
   */
  defaultState?: Contrast
) => Contrast;

/**
 * @title Contrast
 */
export type Contrast = "more" | "less" | "custom" | "no-preference";
