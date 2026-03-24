import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useRef } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js'
import { isBrowser, isFunction } from '../utils/is'
import { guessSerializerType } from '../utils/serializer'
import { useEvent } from '../useEvent'
import { defaultOnError, defaultOptions } from '../utils/defaults'
import { useLatest } from '../useLatest'

export interface Serializer<T> {
  read: (raw: string) => T
  write: (value: T) => string
}

export const StorageSerializers: Record<
  'boolean' | 'object' | 'number' | 'any' | 'string' | 'map' | 'set' | 'date',
  Serializer<any>
> = {
  boolean: {
    read: (v: any) => v === 'true',
    write: (v: any) => String(v),
  },
  object: {
    read: (v: any) => JSON.parse(v),
    write: (v: any) => JSON.stringify(v),
  },
  number: {
    read: (v: any) => Number.parseFloat(v),
    write: (v: any) => String(v),
  },
  any: {
    read: (v: any) => v,
    write: (v: any) => String(v),
  },
  string: {
    read: (v: any) => v,
    write: (v: any) => String(v),
  },
  map: {
    read: (v: any) => new Map(JSON.parse(v)),
    write: (v: any) =>
      JSON.stringify(Array.from((v as Map<any, any>).entries())),
  },
  set: {
    read: (v: any) => new Set(JSON.parse(v)),
    write: (v: any) => JSON.stringify(Array.from(v as Set<any>)),
  },
  date: {
    read: (v: any) => new Date(v),
    write: (v: any) => v.toISOString(),
  },
}

export interface UseStorageOptions<T> {
  /**
   * @en Custom data serialization
   * @zh 自定义数据序列化
   */
  serializer?: Serializer<T>
  /**
   * @en On error callback
   * @zh 错误回调
   * @defaultValue `console.error`
   */
  onError?: (error: unknown) => void
  /**
   * @en set to storage when nodata in first mount
   * @zh 首次挂载时没有数据时设置到 storage
   * @deprecated
   */
  effectStorageValue?: T | (() => T)
  /**
   * @en set to storage when nodata in first mount
   * @zh 首次挂载时没有数据时设置到 storage
   */
  mountStorageValue?: T | (() => T)
  /**
   * @en listen to storage changes
   * @zh 监听 storage 变化
   * @defaultValue `true`
   */
  listenToStorageChanges?: boolean
}

export default function useStorage<
  T extends string | number | boolean | object | null,
>(
  key: string,
  defaultValue?: T,
  getStorage: () => Storage | undefined = () =>
    isBrowser ? sessionStorage : undefined,
  options: UseStorageOptions<T> = defaultOptions,
) {
  let storage: Storage | undefined
  const {
    onError = defaultOnError,
    effectStorageValue,
    mountStorageValue,
    listenToStorageChanges = true,
  } = options
  const storageValueRef = useLatest(mountStorageValue ?? effectStorageValue)
  const onErrorRef = useLatest(onError)

  try {
    storage = getStorage()
  }
  catch (err) {
    onErrorRef.current(err)
  }

  const type = guessSerializerType<T | undefined>(defaultValue)
  const serializerRef = useLatest(options.serializer ?? StorageSerializers[type])

  // storageRef and defaultValueRef are updated synchronously each render so that
  // the stable getSnapshot/getServerSnapshot closures always read current values.
  const storageRef = useRef(storage)
  storageRef.current = storage
  const defaultValueRef = useRef(defaultValue)
  defaultValueRef.current = defaultValue

  // Cache for referential stability of deserialized values.
  // lastRawRef uses three-state semantics:
  //   undefined → no cached value (initial state or after key change) — absent key yields defaultValue
  //   null      → key was explicitly removed (setState(null) or cross-tab) — absent key yields null
  //   string    → cached raw string — compared for referential stability
  const lastRawRef = useRef<string | null | undefined>(undefined)
  const lastKeyRef = useRef<string>(key)
  const lastValueRef = useRef<T | null>(defaultValue ?? null)

  // Reset per-key caches when the key changes (runs during render, before snapshot).
  if (lastKeyRef.current !== key) {
    lastKeyRef.current = key
    lastRawRef.current = undefined
    lastValueRef.current = defaultValue ?? null
  }

  // Internal per-instance subscriber callback stored so updateState can notify it.
  const notifyRef = useRef<(() => void) | null>(null)

  const getSnapshot = useRef((): T | null => {
    const currentStorage = storageRef.current
    const fallback = (defaultValueRef.current ?? null) as T | null
    if (!currentStorage) {
      // Storage unavailable — act as an in-memory state holder using the same
      // three-state lastRawRef semantics so updateState() still works.
      if (lastRawRef.current === undefined)
        return fallback
      return lastRawRef.current === null ? null : lastValueRef.current
    }
    try {
      const raw = currentStorage.getItem(lastKeyRef.current)
      if (raw === null) {
        // lastRawRef === null means the key was explicitly removed; return null.
        // lastRawRef !== null means the key is merely absent (e.g. after key change); return defaultValue.
        return lastRawRef.current === null ? null : fallback
      }
      if (raw === lastRawRef.current)
        return lastValueRef.current
      const deserialized = serializerRef.current.read(raw) as T
      lastRawRef.current = raw
      lastValueRef.current = deserialized
      return deserialized
    }
    catch (e) {
      onErrorRef.current(e)
      return fallback
    }
  }).current

  const getServerSnapshot = useRef((): T | null => {
    return (defaultValueRef.current ?? null) as T | null
  }).current

  // subscribe is stable: it only registers/clears the React-provided callback.
  // Cross-tab listener management is handled separately in a useEffect so that
  // changes to listenToStorageChanges are properly reflected after mount.
  const subscribe = useRef((callback: () => void): (() => void) => {
    notifyRef.current = callback
    return () => {
      notifyRef.current = null
    }
  }).current

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Manage the cross-tab storage listener independently so that toggling
  // listenToStorageChanges after mount correctly adds or removes the listener.
  useEffect(() => {
    if (!listenToStorageChanges || !isBrowser)
      return
    const crossTabListener = (e: StorageEvent) => {
      // e.key is null when storage.clear() is called from another tab (Web Storage
      // spec). In that case all keys are affected, so always notify. Otherwise only
      // notify when the event matches the current key.
      // lastKeyRef is updated synchronously during render, so it always holds the
      // latest key at the time this async event fires.
      if (e.key !== null && e.key !== lastKeyRef.current)
        return
      // e.newValue is null when the key was removed (removeItem or clear).
      // Update the in-memory caches now so getSnapshot returns null immediately
      // rather than falling back to defaultValue, matching the old behavior where
      // the cross-tab listener called updateState(null) for absent keys.
      if (e.newValue === null) {
        lastRawRef.current = null
        lastValueRef.current = null
      }
      notifyRef.current?.()
    }
    window.addEventListener('storage', crossTabListener)
    return () => window.removeEventListener('storage', crossTabListener)
  }, [listenToStorageChanges])

  // Write mountStorageValue / defaultValue to storage on mount when key is absent.
  useEffect(() => {
    const serializer = serializerRef.current
    const storageValue = storageValueRef.current
    const data
      = (storageValue
        ? isFunction(storageValue)
          ? storageValue()
          : storageValue
        : defaultValue) ?? null

    try {
      const raw = storage?.getItem(key)
      if ((raw === null || raw === undefined) && data !== null) {
        storage?.setItem(key, serializer.write(data))
        lastRawRef.current = undefined
        notifyRef.current?.()
      }
    }
    catch (e) {
      onErrorRef.current(e)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, storage])

  const updateState: Dispatch<SetStateAction<T | null>> = useEvent(
    valOrFunc => {
      const currentState = isFunction(valOrFunc) ? valOrFunc(state) : valOrFunc

      if (currentState === null) {
        storage?.removeItem(key)
        lastRawRef.current = null
        lastValueRef.current = null
      }
      else {
        try {
          const raw = serializerRef.current.write(currentState)
          storage?.setItem(key, raw)
          lastRawRef.current = raw
          lastValueRef.current = currentState
        }
        catch (e) {
          onErrorRef.current(e)
          return
        }
      }

      notifyRef.current?.()
    },
  )

  return [state, updateState] as const
}
