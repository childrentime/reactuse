import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useRef } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js'
import { isBrowser, isFunction } from '../utils/is'
import { guessSerializerType } from '../utils/serializer'
import { useEvent } from '../useEvent'
import { useEventListener } from '../useEventListener'
import { defaultOnError, defaultOptions } from '../utils/defaults'
import { useLatest } from '../useLatest'

// Custom DOM event used to keep sibling hook instances in the SAME tab in sync.
// The native `storage` event only fires on OTHER tabs/windows (never on the
// document that made the change), so each write is re-broadcast under this
// custom name and every instance listens for it alongside the native event.
// We deliberately do NOT reuse the native `'storage'` name, to avoid notifying
// unrelated `storage` listeners in the host application. A `window` event (not a
// module-level registry) survives the library being bundled more than once.
const SAME_TAB_STORAGE_EVENT = 'reactuse:storage'

interface SameTabStorageDetail {
  key: string
  newValue: string | null
  storageArea: Storage
}

function dispatchSameTabStorage(detail: SameTabStorageDetail): void {
  if (!isBrowser)
    return
  window.dispatchEvent(new CustomEvent(SAME_TAB_STORAGE_EVENT, { detail }))
}

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
   * @en listen to cross-tab `storage` events. Same-tab sync between components is
   * always on and is not affected by this option.
   * @zh 监听跨标签页的 `storage` 事件。同标签页组件间的同步始终开启，不受此选项影响。
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

  // Shared core for an external change (cross-tab or same-tab). The two listeners
  // below stay separate but funnel through here so the key/area filtering and the
  // removal-reset rule live in exactly one place.
  const applyExternalChange = (
    evKey: string | null,
    evNewValue: string | null,
    evArea: Storage | null | undefined,
  ) => {
    // evKey === null ⇒ storage.clear() ⇒ all keys affected, so don't filter by
    // key. lastKeyRef is updated synchronously during render, so it always holds
    // the latest key when this async event fires.
    if (evKey !== null && evKey !== lastKeyRef.current)
      return
    // Identity-scope by storage area so localStorage / sessionStorage / custom
    // Storage objects never cross-notify (only when the event provides it).
    if (evArea && evArea !== storageRef.current)
      return
    // newValue === null means the key was removed (removeItem or clear). Reset
    // the caches so getSnapshot returns null immediately rather than falling back
    // to defaultValue.
    if (evNewValue === null) {
      lastRawRef.current = null
      lastValueRef.current = null
    }
    notifyRef.current?.()
  }

  // Cross-tab: the native `storage` event fires when ANOTHER tab changes Web
  // Storage (it never fires in the tab that made the change). This is the ONLY
  // path gated by listenToStorageChanges — that option is specifically about
  // cross-tab events. useEventListener keeps the latest handler in a ref, so
  // toggling the option after mount is reflected without re-binding.
  useEventListener('storage', (e: StorageEvent) => {
    if (!listenToStorageChanges)
      return
    applyExternalChange(e.key, e.newValue, e.storageArea)
  })
  // Same-tab: our custom event fires when a SIBLING instance changes the key in
  // THIS tab. ALWAYS on (NOT gated by listenToStorageChanges) — keeping components
  // in one tab consistent is core behavior, not an opt-in. SSR-safe via useEventListener.
  useEventListener(SAME_TAB_STORAGE_EVENT, (e: CustomEvent<SameTabStorageDetail>) => {
    applyExternalChange(e.detail.key, e.detail.newValue, e.detail.storageArea)
  })

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
        const written = serializer.write(data)
        storage?.setItem(key, written)
        lastRawRef.current = undefined
        notifyRef.current?.()
        // Let sibling instances that mounted alongside us (e.g. two useColorMode
        // in a header and footer) pick up the freshly-written default.
        if (storage)
          dispatchSameTabStorage({ key, newValue: written, storageArea: storage })
      }
    }
    catch (e) {
      onErrorRef.current(e)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, storage])

  const updateState: Dispatch<SetStateAction<T | null>> = useEvent(
    valOrFunc => {
      const currentState = isFunction(valOrFunc) ? valOrFunc(getSnapshot()) : valOrFunc

      // Payload broadcast to sibling instances: the raw written string, or null
      // when the key is removed (mirrors StorageEvent.newValue semantics).
      let payload: string | null
      if (currentState === null) {
        storage?.removeItem(key)
        lastRawRef.current = null
        lastValueRef.current = null
        payload = null
      }
      else {
        try {
          const raw = serializerRef.current.write(currentState)
          storage?.setItem(key, raw)
          lastRawRef.current = raw
          lastValueRef.current = currentState
          payload = raw
        }
        catch (e) {
          onErrorRef.current(e)
          return
        }
      }

      notifyRef.current?.()
      // Propagate to sibling instances in this tab (the native `storage` event
      // only reaches OTHER tabs). Our own listener also receives this, but
      // getSnapshot returns the cached value so useSyncExternalStore bails out —
      // no redundant render, hence no self-skip bookkeeping needed.
      if (storage)
        dispatchSameTabStorage({ key, newValue: payload, storageArea: storage })
    },
  )

  return [state, updateState] as const
}
