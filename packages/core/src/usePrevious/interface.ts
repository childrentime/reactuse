/**
 * @title usePrevious
 * @returns 更新前的值
 * @returns_en previous value
 */
export type UsePrevious = <T>(
  /**
   * @zh 状态值
   * @en state value
   */
  state: T
) => T | undefined
