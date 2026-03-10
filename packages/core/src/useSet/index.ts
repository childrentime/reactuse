import { useMemo, useRef, useState } from 'react'
import type { UseSet } from './interface'

export const useSet: UseSet = <T>(initialValues?: Iterable<T>) => {
  const initialRef = useRef(initialValues)
  const [set, setSet] = useState(() => new Set<T>(initialValues))

  const actions = useMemo(() => ({
    add: (value: T) => {
      setSet(prev => {
        const next = new Set(prev)
        next.add(value)
        return next
      })
    },
    remove: (value: T) => {
      setSet(prev => {
        const next = new Set(prev)
        next.delete(value)
        return next
      })
    },
    toggle: (value: T) => {
      setSet(prev => {
        const next = new Set(prev)
        if (next.has(value)) {
          next.delete(value)
        }
        else {
          next.add(value)
        }
        return next
      })
    },
    has: (value: T) => set.has(value),
    clear: () => setSet(new Set<T>()),
    reset: () => setSet(new Set<T>(initialRef.current)),
  }), [set])

  return [set, actions] as const
}
