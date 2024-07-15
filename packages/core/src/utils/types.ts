export type Fn = (this: any, ...args: any[]) => any
export type Awaitable<T> = Promise<T> | T
export type Stoppable = [boolean, Fn, Fn]
export type PointerType = 'mouse' | 'touch' | 'pen'

export interface Position {
  x: number
  y: number
}
