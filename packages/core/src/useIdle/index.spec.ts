import { act, fireEvent, renderHook } from '@testing-library/react'
import { useIdle } from '.'

jest.useFakeTimers()

it('should start from the initial state', () => {
  expect(renderHook(() => useIdle(1000)).result.current).toBe(false)
  expect(renderHook(() => useIdle(1000, true)).result.current).toBe(true)
})

it('should go idle once ms has passed', () => {
  const { result } = renderHook(() => useIdle(1000))

  act(() => {
    jest.advanceTimersByTime(999)
  })
  expect(result.current).toBe(false)

  act(() => {
    jest.advanceTimersByTime(2)
  })
  expect(result.current).toBe(true)
})

it('should leave idle on activity and restart the countdown', () => {
  const { result } = renderHook(() => useIdle(1000))

  act(() => {
    jest.advanceTimersByTime(1001)
  })
  expect(result.current).toBe(true)

  act(() => {
    fireEvent.keyDown(window)
    jest.advanceTimersByTime(51)
  })
  expect(result.current).toBe(false)

  act(() => {
    jest.advanceTimersByTime(1001)
  })
  expect(result.current).toBe(true)
})

// The idle timer runs for `ms` and the throttled listener keeps one of its own,
// so an uncancelled pair outlives the component by up to that long.
it('should leave no timer behind on unmount', () => {
  const { unmount } = renderHook(() => useIdle(60000))
  expect(jest.getTimerCount()).toBeGreaterThan(0)

  unmount()
  expect(jest.getTimerCount()).toBe(0)
})

it('should leave no timer behind after activity then unmount', () => {
  const { unmount } = renderHook(() => useIdle(60000))

  act(() => {
    fireEvent.mouseMove(window)
  })
  unmount()
  expect(jest.getTimerCount()).toBe(0)
})
