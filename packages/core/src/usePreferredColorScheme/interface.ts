/**
 * @title usePreferredColorScheme
 * @returns prefers-color-scheme的媒体查询值
 * @returns_en value of prefers-color-scheme media query
 */
export type UsePreferredColorScheme = (
  /**
   * @zh 默认值
   * @en default value
   * @defaultValue no-preference
   */
  defaultState?: ColorScheme
) => ColorScheme;

/**
 * @title ColorScheme
 */
export type ColorScheme = "dark" | "light" | "no-preference";
