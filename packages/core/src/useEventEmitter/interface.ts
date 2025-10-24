/**
 * @title useEventEmitter
 * @returns 包含以下元素的元组：
 * - 添加监听器的函数。
 * - 触发函数。
 * - 停止函数。
 * @returns_en A tuple with the following elements:
 * - a function to add lisenter.
 * - fire functiion.
 * stop functiion
 * @returns_zh-Hant 包含以下元素的元組：
 * - 添加監聽器的函數。
 * - 觸發函數。
 * - 停止函數。
 */
export type UseEventEmitter = <T, U = void>() => readonly [
  UseEventEmitterEvent<T, U>,
  (arg1: T, arg2: U) => void,
  () => void,
]

export interface UseEventEmitterListener<T, U = void> {
  (arg1: T, arg2: U): void
}

export interface UseEventEmitterDisposable {
  dispose: () => void
}

export interface UseEventEmitterEvent<T, U = void> {
  (listener: (arg1: T, arg2: U) => any): UseEventEmitterDisposable
}

export interface UseEventEmitterEventOnce<T, U = void> {
  (listener: (arg1: T, arg2: U) => any): void
}

export interface UseEventEmitterReturn<T, U = void> {
  /**
   * Subscribe to an event. When calling emit, the listeners will execute.
   * @param listener watch listener.
   * @returns a stop function to remove the current callback.
   */
  event: UseEventEmitterEvent<T, U>
  /**
   * fire an event, the corresponding event listeners will execute.
   * @param event data sent.
   */
  fire: (arg1: T, arg2: U) => void
  /**
   * Remove all corresponding listener.
   */
  dispose: () => void
}
