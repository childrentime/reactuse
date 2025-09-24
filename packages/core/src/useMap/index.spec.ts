import { act, renderHook } from '@testing-library/react'
import { useMap } from '.'

describe('useMap', () => {
  function setUp<K, V>(initialValue?: Map<K, V> | readonly (readonly [K, V])[] | (() => Map<K, V> | readonly (readonly [K, V])[])) {
    return renderHook(() => useMap(initialValue))
  }

  it('should init empty map', () => {
    const { result } = setUp()
    const { map, size } = result.current
    expect(map.size).toEqual(0)
    expect(size).toEqual(0)
  })

  it('should init with array of entries', () => {
    const initialEntries = [['key1', 'value1'], ['key2', 'value2']] as const
    const { result } = setUp(initialEntries)
    const { map, size } = result.current
    expect(map.get('key1')).toEqual('value1')
    expect(map.get('key2')).toEqual('value2')
    expect(size).toEqual(2)
  })

  it('should init with Map instance', () => {
    const initialMap = new Map([['key1', 'value1'], ['key2', 'value2']])
    const { result } = setUp(initialMap)
    const { map, size } = result.current
    expect(map.get('key1')).toEqual('value1')
    expect(map.get('key2')).toEqual('value2')
    expect(size).toEqual(2)
    // Should be a new Map instance, not the same reference
    expect(map).not.toBe(initialMap)
  })

  it('should init with function', () => {
    const initFunc = () => [['key1', 'value1'], ['key2', 'value2']] as const
    const { result } = setUp(initFunc)
    const { map, size } = result.current
    expect(map.get('key1')).toEqual('value1')
    expect(map.get('key2')).toEqual('value2')
    expect(size).toEqual(2)
  })

  it('should set, get, has, remove work correctly', () => {
    const { result } = setUp<string, number>()

    // Test set and get
    act(() => {
      result.current.set('key1', 100)
    })
    expect(result.current.map.get('key1')).toEqual(100)
    expect(result.current.size).toEqual(1)
    
    // Test get function - use current get function after set
    expect(result.current.get('key1')).toEqual(100)
    expect(result.current.get('nonexistent')).toBeUndefined()

    // Test has function - use current has function
    expect(result.current.has('key1')).toBe(true)
    expect(result.current.has('nonexistent')).toBe(false)

    // Test remove
    let removed: boolean
    act(() => {
      removed = result.current.remove('key1')
    })
    expect(removed!).toBe(true)
    expect(result.current.map.has('key1')).toBe(false)
    expect(result.current.size).toEqual(0)

    // Test remove non-existent key
    let removedNonExistent: boolean
    act(() => {
      removedNonExistent = result.current.remove('nonexistent')
    })
    expect(removedNonExistent!).toBe(false)
  })

  it('should clear work correctly', () => {
    const initialEntries = [['key1', 'value1'], ['key2', 'value2']] as const
    const { result } = setUp(initialEntries)

    expect(result.current.size).toEqual(2) // initial size

    act(() => {
      result.current.clear()
    })

    expect(result.current.map.size).toEqual(0)
    expect(result.current.size).toEqual(0)
  })

  it('should reset work correctly', () => {
    const initialEntries = [['key1', 'value1'], ['key2', 'value2']] as const
    const { result } = setUp(initialEntries)

    // Modify the map
    act(() => {
      result.current.set('key3', 'value3')
    })
    expect(result.current.size).toEqual(3)

    // Reset to initial state
    act(() => {
      result.current.reset()
    })
    expect(result.current.map.get('key1')).toEqual('value1')
    expect(result.current.map.get('key2')).toEqual('value2')
    expect(result.current.map.has('key3')).toBe(false)
    expect(result.current.size).toEqual(2)
  })

  it('should maintain immutability', () => {
    const { result } = setUp<string, number>()
    const initialMap = result.current.map

    act(() => {
      result.current.set('key1', 100)
    })

    const newMap = result.current.map
    expect(newMap).not.toBe(initialMap)
    expect(newMap.get('key1')).toEqual(100)
    expect(initialMap.has('key1')).toBe(false)
  })

  it('should get and has functions return updated values after clear', () => {
    const { result } = setUp<string, string>([['key1', 'value1']])

    // Initially should have the value
    expect(result.current.get('key1')).toEqual('value1')
    expect(result.current.has('key1')).toBe(true)

    act(() => {
      result.current.clear()
    })

    // After clear, should return undefined and false - use current functions
    expect(result.current.get('key1')).toBeUndefined()
    expect(result.current.has('key1')).toBe(false)
    expect(result.current.size).toBe(0)
  })
})