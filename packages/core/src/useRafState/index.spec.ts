import { act, renderHook } from '@testing-library/react'
import { useRafState } from '.'

describe('useRafState', () => {
  it('should be defined', () => {
    expect(useRafState).toBeDefined()
  })

  it('should work', () => {
    const mockRaf = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0)
        return 0
      })
    const { result } = renderHook(() => useRafState(0))
    const setRafState = result.current[1]
    expect(result.current[0]).toBe(0)

    act(() => {
      setRafState(1)
    })
    expect(result.current[0]).toBe(1)
    mockRaf.mockRestore()
  })

  it('should handle multiple consecutive functional updates correctly', () => {
    const mockRaf = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0)
        return 0
      })
    const { result } = renderHook(() => useRafState(0))
    const setRafState = result.current[1]
    expect(result.current[0]).toBe(0)

    // Multiple consecutive updates in the same tick
    act(() => {
      setRafState(count => count + 1)
      setRafState(count => count + 1)
      setRafState(count => count + 1)
    })
    
    // Should apply all three updates, resulting in 3
    expect(result.current[0]).toBe(3)
    mockRaf.mockRestore()
  })

  it('should handle mixed value and functional updates', () => {
    const mockRaf = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0)
        return 0
      })
    const { result } = renderHook(() => useRafState(0))
    const setRafState = result.current[1]
    expect(result.current[0]).toBe(0)

    act(() => {
      setRafState(5)
      setRafState(count => count + 1)
      setRafState(count => count * 2)
    })
    
    // Should apply: set to 5, then +1 (=6), then *2 (=12)
    expect(result.current[0]).toBe(12)
    mockRaf.mockRestore()
  })
})
