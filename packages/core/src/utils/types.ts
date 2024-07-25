export type Fn = (this: any, ...args: any[]) => any
export type Awaitable<T> = Promise<T> | T
export type Stoppable = [boolean, Fn, Fn]
export type PointerType = 'mouse' | 'touch' | 'pen'

export interface Position {
  x: number
  y: number
}

/**
 * @title Pausable
 */
export interface Pausable {
  /**
   * @en A ref indicate whether a pausable instance is active
   * @zh 一个 ref，表示一个 pausable 实例是否处于激活状态
   */
  isActive: boolean

  /**
   * @en Temporary pause the effect from executing
   * @zh 暂时暂停效果的执行
   */
  pause: Fn

  /**
   * @en Resume the effects
   * @zh 恢复效果
   */
  resume: Fn
}
