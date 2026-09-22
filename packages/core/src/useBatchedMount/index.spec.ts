import { act, cleanup, renderHook } from '@testing-library/react'
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

  // Clamp to the new total, not back to a single batch — dropping rows must
  // not unmount the whole list and re-reveal it over nine frames.
  rerender({ total: 200, batchSize: 30 })
  expect(result.current).toBe(200)

  // Already at the new total, so nothing further is scheduled.
  expect(jest.getTimerCount()).toBe(0)
})

it('should leave mounted untouched when total shrinks but stays above it', () => {
  const { result, rerender } = renderHook(
    ({ total, batchSize }) => useBatchedMount(total, batchSize),
    { initialProps: { total: 300, batchSize: 30 } },
  )
  expect(result.current).toBe(30)

  rerender({ total: 100, batchSize: 30 })
  expect(result.current).toBe(30)

  act(() => {
    jest.advanceTimersByTime(48)
  })
  expect(result.current).toBe(60)
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

// `batchSize` is realistically derived from a measurement — `height / rowHeight`
// is 0 before the container has been laid out. Advancing by 0 makes React bail
// out of the re-render, so the effect never re-runs and nothing reschedules:
// without a floor the list stays empty forever, silently.
it('should still make progress when batchSize is below 1', () => {
  for (const batchSize of [0, -5, 0.5]) {
    const { result, unmount } = renderHook(() => useBatchedMount(3, batchSize))
    expect(result.current).toBe(1)

    act(() => {
      jest.advanceTimersByTime(48)
    })
    expect(result.current).toBe(2)

    act(() => {
      jest.advanceTimersByTime(48)
    })
    expect(result.current).toBe(3)

    unmount()
  }
})

it('should floor a fractional batchSize', () => {
  const { result } = renderHook(() => useBatchedMount(30, 10.7))
  expect(result.current).toBe(10)

  act(() => {
    jest.advanceTimersByTime(48)
  })
  expect(result.current).toBe(20)
})

it('should never return a negative count for a non-positive total', () => {
  expect(renderHook(() => useBatchedMount(0, 3)).result.current).toBe(0)
  expect(renderHook(() => useBatchedMount(-10, 3)).result.current).toBe(0)
  expect(jest.getTimerCount()).toBe(0)
})

// A scheduled reveal outlives the component unless the idle callback is
// cancelled on unmount.
it('should leave no timer behind on unmount', () => {
  const { unmount } = renderHook(() => useBatchedMount(10, 3))
  expect(jest.getTimerCount()).toBeGreaterThan(0)

  unmount()
  expect(jest.getTimerCount()).toBe(0)
})

/*
 * jsdom ships no `requestIdleCallback`, so every test above exercises the
 * `setTimeout` fallback — the path that actually runs in production would
 * otherwise have no coverage at all. Back a stub with `setTimeout` so the fake
 * timers still drive it.
 */
describe('requestIdleCallback path', () => {
  let requestIdleCallback: jest.Mock
  let cancelIdleCallback: jest.Mock

  beforeEach(() => {
    requestIdleCallback = jest.fn((cb: IdleRequestCallback) =>
      window.setTimeout(
        () => cb({ didTimeout: false, timeRemaining: () => 50 }),
        0,
      ),
    )
    cancelIdleCallback = jest.fn((handle: number) =>
      window.clearTimeout(handle),
    )

    window.requestIdleCallback = requestIdleCallback as any
    window.cancelIdleCallback = cancelIdleCallback as any
  })

  afterEach(() => {
    /*
     * Unmount before restoring: Testing Library's automatic cleanup runs after
     * this hook, so tearing the stub down first would leave the effect's own
     * cleanup calling an undefined `cancelIdleCallback` and leak the timer into
     * the next test.
     */
    cleanup()

    window.requestIdleCallback = undefined as any
    window.cancelIdleCallback = undefined as any
  })

  it('should reveal batches through requestIdleCallback when it exists', () => {
    const { result } = renderHook(() => useBatchedMount(10, 3))
    expect(result.current).toBe(3)
    expect(requestIdleCallback).toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(result.current).toBe(6)

    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(result.current).toBe(9)

    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(result.current).toBe(10)
  })

  // Without a timeout the browser is free to never find an idle window on a
  // busy main thread — the exact case this hook is reached for.
  it('should pass a timeout so a busy main thread cannot starve a batch', () => {
    renderHook(() => useBatchedMount(10, 3))

    expect(requestIdleCallback).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ timeout: 100 }),
    )
  })

  it('should cancel the pending idle callback on unmount', () => {
    const { unmount } = renderHook(() => useBatchedMount(10, 3))
    const handle = requestIdleCallback.mock.results[0].value

    unmount()

    expect(cancelIdleCallback).toHaveBeenCalledWith(handle)
    expect(jest.getTimerCount()).toBe(0)
  })

  it('should stop requesting idle callbacks once total is mounted', () => {
    renderHook(() => useBatchedMount(4, 3))

    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(requestIdleCallback).toHaveBeenCalledTimes(1)
    expect(jest.getTimerCount()).toBe(0)
  })
})
