import { act, renderHook } from '@testing-library/react'
import { useLocalStorage } from '.'

describe(useLocalStorage, () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('retrieves an existing value from localStorage', () => {
    localStorage.setItem('foo', 'bar')
    const { result } = renderHook(() => useLocalStorage('foo', ''))
    const [state] = result.current
    expect(state).toEqual('bar')
  })

  it('should return initialValue if localStorage empty and set that to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('foo', 'bar'))
    const [state] = result.current
    expect(state).toEqual('bar')
    expect(localStorage.getItem('foo')).toEqual('bar')
  })

  it('prefers existing value over initial state', () => {
    localStorage.setItem('foo', 'bar')
    const { result } = renderHook(() => useLocalStorage('foo', 'baz'))
    const [state] = result.current
    expect(state).toEqual('bar')
  })

  it('does not clobber existing localStorage with initialState', () => {
    localStorage.setItem('foo', 'bar')
    const { result } = renderHook(() => useLocalStorage('foo', 'buzz'))
    expect(result.current).toBeTruthy()
    expect(localStorage.getItem('foo')).toEqual('bar')
  })

  it('correctly updates localStorage', () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage('foo', 'bar'),
    )

    const [, setFoo] = result.current
    act(() => setFoo('baz'))
    rerender()

    expect(localStorage.getItem('foo')).toEqual('baz')
  })

  it('should return undefined and clear localStorage if set null', () => {
    const { result } = renderHook(() => useLocalStorage('some_key', 'bar'))
    expect(localStorage.getItem('some_key')).toBe('bar')
    const [, setState] = result.current
    act(() => setState(null))
    expect(result.current[0]).toBeNull()
    expect(localStorage.getItem('some_key')).toBeNull()
  })

  it('sets initialState if initialState is an object', () => {
    renderHook(() => useLocalStorage('foo', { bar: true }))
    expect(localStorage.getItem('foo')).toEqual('{"bar":true}')
  })

  it('correctly and promptly returns a new value', () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage('foo', 'bar'),
    )

    const [, setFoo] = result.current
    act(() => setFoo('baz'))
    rerender()

    const [foo] = result.current
    expect(foo).toEqual('baz')
  })

  it('reinitializes state when key changes', () => {
    let key = 'foo'
    const { result, rerender } = renderHook(() => useLocalStorage(key, 'bar'))

    const [, setState] = result.current
    act(() => setState('baz'))
    key = 'bar'
    rerender()

    const [state] = result.current
    expect(state).toEqual('bar')
  })

  it('parses out objects from localStorage', () => {
    const defaultsValue = { ok: false }
    localStorage.setItem('foo', JSON.stringify({ ok: true }))
    const { result } = renderHook(() => useLocalStorage('foo', defaultsValue))
    const [foo] = result.current
    expect(foo?.ok).toEqual(true)
  })

  it('safely initializes objects to localStorage', () => {
    const defaultsValue = { ok: true }
    const { result } = renderHook(() =>
      useLocalStorage<{ ok: boolean }>('foo', defaultsValue),
    )
    const [foo] = result.current
    expect(foo?.ok).toEqual(true)
  })

  it('safely sets objects to localStorage', () => {
    const defaultsValue = { ok: true }
    const { result, rerender } = renderHook(() =>
      useLocalStorage<{ ok: any }>('foo', defaultsValue),
    )

    const [, setFoo] = result.current
    act(() => setFoo({ ok: 'bar' }))
    rerender()

    const [foo] = result.current
    expect(foo?.ok).toEqual('bar')
  })

  it('safely returns objects from updates', () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage<{ ok: any }>('foo', { ok: true }),
    )

    const [, setFoo] = result.current
    act(() => setFoo({ ok: 'bar' }))
    rerender()

    const [foo] = result.current
    expect(foo).toBeInstanceOf(Object)
    expect(foo?.ok).toEqual('bar')
  })

  it('sets localStorage from the function updater', () => {
    const defaultValue = { foo: 'bar' }
    const { result, rerender } = renderHook(() =>
      useLocalStorage<{ foo: string, fizz?: string }>('foo', defaultValue),
    )

    const [, setFoo] = result.current
    act(() => setFoo(state => ({ ...state!, fizz: 'buzz' })))
    rerender()

    const [value] = result.current
    expect(value?.foo).toEqual('bar')
    expect(value?.fizz).toEqual('buzz')
  })

  it('memoizes an object between rerenders', () => {
    const defaultValue = { ok: true }
    const { result, rerender } = renderHook(() =>
      useLocalStorage('foo', defaultValue),
    );
    (() => {
      return result.current
    })()
    rerender()
    const [r2] = result.current
    rerender()
    const [r3] = result.current
    expect(r2).toBe(r3)
  })

  it('memoizes an object immediately if localStorage is already set', () => {
    const defaultValue = { ok: true }
    localStorage.setItem('foo', JSON.stringify({ ok: true }))
    const { result, rerender } = renderHook(() =>
      useLocalStorage('foo', defaultValue),
    )

    const [r1] = result.current
    rerender()
    const [r2] = result.current
    expect(r1).toBe(r2)
  })

  it('memoizes the setState function', () => {
    const defaultValue = { ok: true }
    localStorage.setItem('foo', JSON.stringify({ ok: true }))
    const { result, rerender } = renderHook(() =>
      useLocalStorage('foo', defaultValue),
    )
    const [, s1] = result.current
    rerender()
    const [, s2] = result.current
    expect(s1).toBe(s2)
  })

  it('date', async () => {
    const defaultValue = new Date('2000-01-02T00:00:00.000Z')
    localStorage.setItem('KEY', '2000-01-01T00:00:00.000Z')

    const { result, rerender } = renderHook(() =>
      useLocalStorage('KEY', defaultValue),
    )
    const [state, setState] = result.current
    expect(state).toEqual(new Date('2000-01-01T00:00:00.000Z'))
    act(() => setState(new Date('2000-01-03T00:00:00.000Z')))
    rerender()
    expect(localStorage.getItem('KEY')).toBe('2000-01-03T00:00:00.000Z')
  })

  it('map', async () => {
    const defaultValue = new Map<number, string | number>([
      [1, 'a'],
      [2, 2],
    ])
    const { result, rerender } = renderHook(() =>
      useLocalStorage('key', defaultValue),
    )
    const [state, setState] = result.current
    expect(state).toEqual(
      new Map<number, string | number>([
        [1, 'a'],
        [2, 2],
      ]),
    )
    act(() =>
      setState(
        new Map<number, string | number>([
          [1, 'a'],
          [2, 3],
        ]),
      ),
    )
    rerender()
    expect(result.current[0]).toEqual(
      new Map<number, string | number>([
        [1, 'a'],
        [2, 3],
      ]),
    )
  })

  it('set', () => {
    const defaultValue = new Set<string | number>([1, 'a'])
    const { result, rerender } = renderHook(() =>
      useLocalStorage('key', defaultValue),
    )
    const [state, setState] = result.current
    expect(state).toEqual(new Set<string | number>([1, 'a']))
    act(() => setState(new Set<string | number>([1, 'b'])))
    rerender()
    expect(result.current[0]).toEqual(new Set<string | number>([1, 'b']))
  })

  it('custom serializer', () => {
    const serializer = {
      serializer: { read: JSON.parse, write: JSON.stringify },
    }
    const { result, rerender } = renderHook(() =>
      useLocalStorage<any>('key', 0, serializer),
    )
    const [state, setState] = result.current
    expect(state).toEqual(0)
    act(() => setState({ name: 'a', data: 123 }))
    rerender()
    expect(result.current[0]).toEqual({ name: 'a', data: 123 })
    expect(localStorage.getItem('key')).toEqual('{"name":"a","data":123}')
  })

  // --- Cross-tab storage event tests ---

  it('updates state when a cross-tab storage event fires for the same key', () => {
    const { result } = renderHook(() => useLocalStorage('foo', 'bar'))
    expect(result.current[0]).toEqual('bar')

    act(() => {
      // Simulate another tab writing to the same key
      localStorage.setItem('foo', 'from-other-tab')
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'foo',
          newValue: 'from-other-tab',
          oldValue: 'bar',
          storageArea: localStorage,
        }),
      )
    })

    expect(result.current[0]).toEqual('from-other-tab')
  })

  it('ignores cross-tab storage events for a different key', () => {
    const { result } = renderHook(() => useLocalStorage('foo', 'bar'))

    act(() => {
      localStorage.setItem('other', 'value')
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'other',
          newValue: 'value',
          oldValue: null,
          storageArea: localStorage,
        }),
      )
    })

    expect(result.current[0]).toEqual('bar')
  })

  it('handles cross-tab key removal (newValue === null)', () => {
    localStorage.setItem('foo', 'existing')
    const { result } = renderHook(() => useLocalStorage('foo', 'default'))
    expect(result.current[0]).toEqual('existing')

    act(() => {
      localStorage.removeItem('foo')
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'foo',
          newValue: null,
          oldValue: 'existing',
          storageArea: localStorage,
        }),
      )
    })

    // After explicit removal, should return null (not defaultValue)
    expect(result.current[0]).toBeNull()
  })

  it('handles cross-tab storage.clear() (key === null)', () => {
    localStorage.setItem('foo', 'existing')
    const { result } = renderHook(() => useLocalStorage('foo', 'default'))
    expect(result.current[0]).toEqual('existing')

    act(() => {
      localStorage.clear()
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: null,
          newValue: null,
          oldValue: null,
          storageArea: localStorage,
        }),
      )
    })

    // After clear(), should return null
    expect(result.current[0]).toBeNull()
  })

  // --- listenToStorageChanges option tests ---

  it('does not react to storage events when listenToStorageChanges is false', () => {
    const { result } = renderHook(() =>
      useLocalStorage('foo', 'bar', { listenToStorageChanges: false }),
    )
    expect(result.current[0]).toEqual('bar')

    act(() => {
      localStorage.setItem('foo', 'changed')
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'foo',
          newValue: 'changed',
          oldValue: 'bar',
          storageArea: localStorage,
        }),
      )
    })

    // Should still see old value since listener is disabled
    expect(result.current[0]).toEqual('bar')
  })

  it('picks up storage events after toggling listenToStorageChanges from false to true', () => {
    let listen = false
    const { result, rerender } = renderHook(() =>
      useLocalStorage('foo', 'bar', { listenToStorageChanges: listen }),
    )

    // Initially not listening — event should be ignored
    act(() => {
      localStorage.setItem('foo', 'ignored')
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'foo',
          newValue: 'ignored',
          oldValue: 'bar',
          storageArea: localStorage,
        }),
      )
    })
    expect(result.current[0]).toEqual('bar')

    // Enable listening
    listen = true
    rerender()

    act(() => {
      localStorage.setItem('foo', 'heard')
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'foo',
          newValue: 'heard',
          oldValue: 'ignored',
          storageArea: localStorage,
        }),
      )
    })

    expect(result.current[0]).toEqual('heard')
  })

  // --- Three-state semantics: setState(null) vs absent key ---

  it('returns null after setState(null), not defaultValue', () => {
    const { result } = renderHook(() => useLocalStorage('foo', 'default'))
    expect(result.current[0]).toEqual('default')

    act(() => result.current[1](null))

    expect(result.current[0]).toBeNull()
    expect(localStorage.getItem('foo')).toBeNull()
  })

  // --- onError callback ---

  it('calls onError when storage.getItem throws', () => {
    const onError = jest.fn()
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage read error')
    })

    const { result } = renderHook(() =>
      useLocalStorage('foo', 'fallback', { onError }),
    )

    expect(result.current[0]).toEqual('fallback')
    expect(onError).toHaveBeenCalled()

    spy.mockRestore()
  })

  it('calls onError when storage.setItem throws on update', () => {
    const onError = jest.fn()
    const { result } = renderHook(() =>
      useLocalStorage('foo', 'bar', { onError }),
    )

    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })

    act(() => result.current[1]('new-value'))

    expect(onError).toHaveBeenCalledWith(expect.any(Error))
    spy.mockRestore()
  })

  // --- mountStorageValue option ---

  it('writes mountStorageValue to storage when key is absent', () => {
    const { result } = renderHook(() =>
      useLocalStorage('foo', 'default', { mountStorageValue: 'mounted' }),
    )

    expect(localStorage.getItem('foo')).toEqual('mounted')
    // After mount effect, state should reflect the mounted value
    expect(result.current[0]).toEqual('mounted')
  })

  it('does not overwrite existing storage with mountStorageValue', () => {
    localStorage.setItem('foo', 'existing')
    const { result } = renderHook(() =>
      useLocalStorage('foo', 'default', { mountStorageValue: 'mounted' }),
    )

    expect(localStorage.getItem('foo')).toEqual('existing')
    expect(result.current[0]).toEqual('existing')
  })

  // --- Consecutive functional updates ---

  it('handles two sequential functional updates in separate act() calls', () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage('counter', 0),
    )
    expect(result.current[0]).toEqual(0)

    act(() => {
      result.current[1](prev => (prev ?? 0) + 1)
    })
    act(() => {
      result.current[1](prev => (prev ?? 0) + 1)
    })
    rerender()

    // Separate act() calls flush between each, so this works
    expect(result.current[0]).toEqual(2)
    expect(localStorage.getItem('counter')).toEqual('2')
  })

  it('two functional updates in the SAME act() both apply correctly', () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage('counter', 0),
    )
    expect(result.current[0]).toEqual(0)

    act(() => {
      // Both calls happen synchronously before React re-renders.
      // getSnapshot() reads the latest value from storage each time,
      // so the second call sees the result of the first.
      result.current[1](prev => (prev ?? 0) + 1) // prev=0, writes 1
      result.current[1](prev => (prev ?? 0) + 1) // prev=1 (fresh!), writes 2
    })
    rerender()

    expect(result.current[0]).toEqual(2)
    expect(localStorage.getItem('counter')).toEqual('2')
  })
})
