/**
 * @title useOrientation
 * @returns 包含以下元素的元组：
 * - 方向状态。
 * - 锁定方向。
 * - 解锁方向。
 * @returns_en A tuple with the following elements:
 * - orientation type.
 * - lock orientation.
 * - unlock orientation.
 * @returns_zh-Hant 包含以下元素的元組：
 * - 方向狀態。
 * - 鎖定方向。
 * - 解鎖方向。
 */
export type UseOrientation = (
  /**
   * @zh 初始值
   * @zh-Hant 初始值
   * @en initial value
   */
  initialState?: UseOrientationState
) => readonly [
  UseOrientationState,
  (type: UseOrientationLockType) => any,
  () => void,
]

/**
 * @title UseOrientationState
 */
export interface UseOrientationState {
  /**
   * @zh 角度
   * @en document angle
   */
  angle: number
  /**
   * @zh 方向类型
   * @en orientation type
   */
  type: UseOrientationType | undefined
}

/**
 * @title UseOrientationType
 */
export type UseOrientationType =
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary'

/**
 * @title UseOrientationLockType
 */
export type UseOrientationLockType =
  | 'any'
  | 'natural'
  | 'landscape'
  | 'portrait'
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary'
