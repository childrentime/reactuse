/**
 * @title useMediaQuery
 * @returns 是否符合媒体查询
 * @returns_en whether comply with media inquiries
 * @returns_zh-Hant 是否符合媒體查詢
 */
export type UseMediaQuery = (
  /**
   * @zh 媒体查询字符串
   * @zh-Hant 媒體查詢字符串
   * @en media query string
   */
  query: string,
  /**
   * @zh 默认值
   * @zh-Hant 預設值
   * @en default value
   */
  defaultState?: boolean
) => boolean
