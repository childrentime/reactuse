import { act, renderHook } from '@testing-library/react'
import { sleep } from '../../.test/testingHelpers'
import { useThrottle } from '.'

describe('useThrottle', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('should be defined', () => {
    expect(useThrottle).toBeDefined()
  })

  it('should have a value to be returned', () => {
    const { result } = renderHook(() => useThrottle(0, 100))
    expect(result.current).toBe(0)
  })

  it('should has same value if time is advanced less than the given time', () => {
    const { result, rerender } = renderHook(
      props => useThrottle(props, 100),
      {
        initialProps: 0,
      },
    )
    expect(result.current).toBe(0)
    rerender(1)
    jest.advanceTimersByTime(50)
    expect(result.current).toBe(0)
  })

  it('should not update the value after the given time', () => {
    const hook = renderHook(props => useThrottle(props, 100), {
      initialProps: 0,
    })
    expect(hook.result.current).toBe(0)
    jest.advanceTimersByTime(100)
    expect(hook.result.current).toBe(0)
  })

  it('should cancel timeout on unmount', () => {
    const hook = renderHook(props => useThrottle(props, 100), {
      initialProps: 0,
    })
    expect(hook.result.current).toBe(0)
    hook.rerender(1)
    hook.unmount()
    expect(jest.getTimerCount()).toBe(0)
    jest.advanceTimersByTime(100)
    expect(hook.result.current).toBe(0)
  })

  it('default useThrottle should work', async () => {
    jest.useRealTimers()
    const hook = renderHook(props => useThrottle(props, 500), {
      initialProps: 1,
    })

    act(() => {
      hook.rerender(2)
    })
    act(() => {
      hook.rerender(3)
    })
    expect(hook.result.current).toEqual(1)
    await act(async () => {
      await sleep(250)
    })
    expect(hook.result.current).toEqual(1)
    act(() => {
      hook.rerender(4)
    })
    await act(async () => {
      hook.rerender(5)
      await sleep(260)
    })
    expect(hook.result.current).toEqual(4)
  })
})
