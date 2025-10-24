import type { Dispatch, SetStateAction } from 'react'

/**
 * @title useRafState
 * @returns 包含以下元素的元组：
 * - state 的当前值。
 * - 在 `requestAnimationFrame` 中更新 state 值的函数。
 * @returns_en A tuple with the following elements:
 * - the state value
 * - a function to update state in `requestAnimationFrame`
 * @returns_zh-Hant 包含以下元素的元組：
 * - state 的當前值。
 * - 在 `requestAnimationFrame` 中更新 state 值的函數。
 */
export type UseRafState = <S>(
  /**
   * @zh 状态值
   * @zh-Hant 狀態值
   * @en state value
   */
  initialState: S | (() => S)
) => readonly [S, Dispatch<SetStateAction<S>>]
