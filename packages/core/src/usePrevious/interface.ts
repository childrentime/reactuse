/**
 * @title usePrevious
 * @returns 更新前的值
 * @returns_en previous value
 * @returns_zh-Hant 更新前的值
 * @returns_ru предыдущее значение
 */
export type UsePrevious = <T>(
  /**
   * @zh 状态值
   * @zh-Hant 狀態值
   * @ru значение состояния
   * @en state value
   */
  state: T
) => T | undefined
