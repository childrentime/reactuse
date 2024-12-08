import type { MutableRefObject } from 'react'
import { useRef } from 'react'
import { useIsomorphicLayoutEffect } from '../useIsomorphicLayoutEffect'
import type { UseLatest } from './interface'

export const useLatest: UseLatest = <T>(value: T): MutableRefObject<T> => {
  const ref = useRef(value)
  useIsomorphicLayoutEffect(() => {
    ref.current = value
  }, [value])
  return ref
}
