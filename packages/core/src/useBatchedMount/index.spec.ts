import { act, renderHook } from '@testing-library/react'
import { useBatchedMount } from '.'

jest.useFakeTimers()

it('should mount the first batch synchronously', () => {
  expect(renderHook(() => useBatchedMount(10, 3)).result.current).toBe(3)
  expect(renderHook(() => useBatchedMount(2, 3)).result.current).toBe(2)
})

it('should reveal another batch per idle frame until total is reached', () => {
  const { result } = renderHook(() => useBatchedMount(10, 3))
  expect(result.current).toBe(3)

  act(() => {
    jest.advanceTimersByTime(48)
  })
  expect(result.current).toBe(6)

  act(() => {
    jest.advanceTimersByTime(48)
  })
  expect(result.current).toBe(9)

  act(() => {
    jest.advanceTimersByTime(48)
  })
  expect(result.current).toBe(10)
})

it('should stop scheduling once total is mounted', () => {
  const { result } = renderHook(() => useBatchedMount(4, 3))

  act(() => {
    jest.advanceTimersByTime(48)
  })
  expect(result.current).toBe(4)
  expect(jest.getTimerCount()).toBe(0)
})

it('should re-batch when batchSize changes', () => {
  const { result, rerender } = renderHook(
    ({ total, batchSize }) => useBatchedMount(total, batchSize),
    { initialProps: { total: 10, batchSize: 3 } },
  )
  expect(result.current).toBe(3)

  rerender({ total: 20, batchSize: 5 })
  expect(result.current).toBe(5)
})

it('should clamp mounted when total shrinks below it', () => {
  const { result, rerender } = renderHook(
    ({ total, batchSize }) => useBatchedMount(total, batchSize),
    { initialProps: { total: 300, batchSize: 30 } },
  )

  // Settle at total=300 (first batch is synchronous, 9 more idle batches).
  for (let i = 0; i < 9; i++) {
    act(() => {
      jest.advanceTimersByTime(48)
    })
  }
  expect(result.current).toBe(300)

  rerender({ total: 200, batchSize: 30 })
  expect(result.current).toBe(30)
})

it('should preserve mounted progress and keep batching when total grows', () => {
  const { result, rerender } = renderHook(
    ({ total, batchSize }) => useBatchedMount(total, batchSize),
    { initialProps: { total: 300, batchSize: 30 } },
  )

  // Settle at total=300 (first batch is synchronous, 9 more idle batches).
  for (let i = 0; i < 9; i++) {
    act(() => {
      jest.advanceTimersByTime(48)
    })
  }
  expect(result.current).toBe(300)

  // Appending rows to a growing feed must not unmount what is already
  // rendered — progress is kept and batching continues toward the new total.
  rerender({ total: 330, batchSize: 30 })
  expect(result.current).toBe(300)

  act(() => {
    jest.advanceTimersByTime(48)
  })
  expect(result.current).toBe(330)
})

// A scheduled reveal outlives the component unless the idle callback is
// cancelled on unmount.
it('should leave no timer behind on unmount', () => {
  const { unmount } = renderHook(() => useBatchedMount(10, 3))
  expect(jest.getTimerCount()).toBeGreaterThan(0)

  unmount()
  expect(jest.getTimerCount()).toBe(0)
})
