/**
 * @title usePreferredDark
 * @returns 是否偏好黑色
 * @returns_en whether prefer dark
 * @returns_zh-Hant 是否偏好黑色
 * @returns_ru предпочитает ли пользователь темную тему
 */
export type UsePreferredDark = (
  /**
   * @zh 默认值
   * @zh-Hant 預設值
   * @en defaule value
   * @ru значение по умолчанию
   */
  defaultState?: boolean
) => boolean
