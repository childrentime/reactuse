/**
 * @title UsePreferredLanguages
 * @returns 语言偏好
 * @returns_en preferred languages
 * @returns_zh-Hant 語言偏好
 * @returns_ru предпочитаемые языки
 */
export type UsePreferredLanguages = (
  /**
   * @zh 默认值
   * @zh-Hant 預設值
   * @ru значение по умолчанию
   * @en defaule value
   */ defaultLanguages?: string[]
) => string[]
