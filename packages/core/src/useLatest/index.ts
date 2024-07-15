import type { MutableRefObject } from 'react'
import { useRef } from 'react'
import type { UseLatest } from './interface'

export const useLatest: UseLatest = <T>(value: T): MutableRefObject<T> => {
  const ref = useRef(value)
  ref.current = value
  return ref
}
