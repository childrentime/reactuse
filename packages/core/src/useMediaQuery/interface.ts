/**
 * @title useMediaQuery
 * @returns 是否符合媒体查询
 * @returns_en whether comply with media inquiries
 */
export type UseMediaQuery = (
  /**
   * @zh 媒体查询字符串
   * @en media query string
   */
  query: string,
  /**
   * @zh 默认值
   * @en default value
   */
  defaultState?: boolean
) => boolean;
