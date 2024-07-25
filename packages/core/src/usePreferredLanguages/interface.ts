/**
 * @title UsePreferredLanguages
 * @returns 语言偏好
 * @returns_en preferred languages
 */
export type UsePreferredLanguages = (
  /**
   * @zh 默认值
   * @en defaule value
   */ defaultLanguages?: string[]
) => string[]
