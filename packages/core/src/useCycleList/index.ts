import { useState } from 'react'
import type { UseCycleList } from './interface'

export const useCycleList: UseCycleList = <T> (
  list: T[],
  i = 0,
): readonly [T, (i?: number) => void, (i?: number) => void] => {
  const [index, setIndex] = useState(i)

  const set = (i: number) => {
    setIndex(current => {
      const length = list.length
      // An empty list has no index to move to, and `% 0` is NaN.
      if (length === 0)
        return current
      return (((current + i) % length) + length) % length
    })
  }

  const next = (i = 1) => {
    set(i)
  }

  const prev = (i = 1) => {
    set(-i)
  }

  return [list[index], next, prev] as const
}
