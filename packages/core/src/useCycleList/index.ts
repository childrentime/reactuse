import { useState } from 'react'
import type { UseCycleList } from './interface'

export const useCycleList: UseCycleList = <T> (
  list: T[],
  i = 0,
): readonly [T, (i?: number) => void, (i?: number) => void] => {
  const [index, setIndex] = useState(i)

  const set = (i: number) => {
    const length = list.length
    const nextIndex = (((index + i) % length) + length) % length
    setIndex(nextIndex)
  }

  const next = (i = 1) => {
    set(i)
  }

  const prev = (i = 1) => {
    set(-i)
  }

  return [list[index], next, prev] as const
}
