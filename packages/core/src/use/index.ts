import React from 'react'
import type { Use } from './interface'

/**
 * @description copy from swr
 */
export const use
// @ts-expect-error polyfill
  = React.use
  // This extra generic is to avoid TypeScript mixing up the generic and JSX sytax
  // and emitting an error.
  // We assume that this is only for the `use(thenable)` case, not `use(context)`.
  // https://github.com/facebook/react/blob/aed00dacfb79d17c53218404c52b1c7aa59c4a89/packages/react-server/src/ReactFizzThenable.js#L45
    || ((<T, _>(
      thenable: Promise<T> & {
        status?: 'pending' | 'fulfilled' | 'rejected'
        value?: T
        reason?: unknown
      },
    ): T => {
      switch (thenable.status) {
        case 'pending':
          throw thenable
        case 'fulfilled':
          return thenable.value as T
        case 'rejected':
          throw thenable.reason
        default:
          thenable.status = 'pending'
          thenable.then(
            v => {
              thenable.status = 'fulfilled'
              thenable.value = v
            },
            e => {
              thenable.status = 'rejected'
              thenable.reason = e
            },
          )
          throw thenable
      }
    }) as Use)
