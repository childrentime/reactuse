import { useCallback, useState } from 'react'
import { useEvent } from '../useEvent'
import type { UseMap } from './interface'

export const useMap: UseMap = <K, V>(
  initialValue?: Map<K, V> | readonly (readonly [K, V])[] | (() => Map<K, V> | readonly (readonly [K, V])[]),
) => {
  // avoid exec init code every render
  const initFunc = (): Map<K, V> => {
    if (typeof initialValue === 'function') {
      const result = initialValue()
      return result instanceof Map ? new Map(result) : new Map(result)
    }

    if (initialValue instanceof Map) {
      return new Map(initialValue)
    }

    if (Array.isArray(initialValue)) {
      return new Map(initialValue)
    }

    return new Map<K, V>()
  }

  const [map, setMap] = useState<Map<K, V>>(initFunc)

  const set = useEvent((key: K, value: V) => {
    setMap(prevMap => {
      const newMap = new Map(prevMap)
      newMap.set(key, value)
      return newMap
    })
  })

  const get = useCallback((key: K): V | undefined => {
    return map.get(key) as V | undefined
  }, [map])

  const remove = useEvent((key: K): boolean => {
    const hasKey = map.has(key)
    if (hasKey) {
      setMap(prevMap => {
        const newMap = new Map(prevMap)
        newMap.delete(key)
        return newMap
      })
    }
    return hasKey
  })

  const has = useCallback((key: K): boolean => {
    return map.has(key)
  }, [map])

  const clear = useEvent(() => {
    setMap(new Map<K, V>())
  })

  const reset = useEvent(() => {
    setMap(initFunc())
  })

  return {
    map,
    set,
    get,
    remove,
    has,
    clear,
    reset,
    size: map.size,
  } as const
}
