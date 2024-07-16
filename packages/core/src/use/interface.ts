import type { Context } from 'react'

interface ThenableImpl<T> {
  then: (onFulfill: (value: T) => unknown, onReject: (error: unknown) => unknown) => void | PromiseLike<unknown>
}

interface UntrackedThenable<T> extends ThenableImpl<T> {
  status?: void
}

interface PendingThenable<T> extends ThenableImpl<T> {
  status: 'pending'
}

interface FulfilledThenable<T> extends ThenableImpl<T> {
  status: 'fulfilled'
  value: T
}

interface RejectedThenable<T> extends ThenableImpl<T> {
  status: 'rejected'
  reason: unknown
}
type Thenable<T> = UntrackedThenable<T> | PendingThenable<T> | FulfilledThenable<T> | RejectedThenable<T>

type Usable<T> = Thenable<T> | Context<T>

/**
 * @title Use
 * @returns 解析状态值
 * @returns_en resolved state value
 */
export type Use = <T>(
  /**
   * @zh promise 或者 context
   * @en promise or context
   */
  usable: Usable<T>
) => T
