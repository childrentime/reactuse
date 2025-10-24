/**
 * @title useReducedMotion
 * @returns 是否偏好减少动画
 * @returns_en whether prefer reduced motion
 * @returns_zh-Hant 是否偏好減少動畫
 */
export type UseReducedMotion = (
  /**
   * @zh 默认值
   * @zh-Hant 預設值
   * @en default value
   */
  defaultState?: boolean
) => boolean
