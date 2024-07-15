import { act, renderHook } from '@testing-library/react'
import { useAsyncEffect } from '.'

async function getMockedData() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(200)
    }, 50)
  })
}

describe('useAsyncEffect', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  it('test async await', async () => {
    let data
    renderHook(() => {
      useAsyncEffect(async () => {
        data = await getMockedData()
      })
    })
    await act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(data).toEqual(200)
  })

  it('test async await with clean up', async () => {
    let data
    let cleanup
    const hook = renderHook(() => {
      useAsyncEffect(
        async () => {
          data = await getMockedData()
        },
        async () => {
          cleanup = await getMockedData()
        },
      )
    })

    await act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(data).toEqual(200)
    expect(cleanup).toEqual(void 0)
    await act(() => {
      hook.rerender()
    })
    await act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(cleanup).toEqual(200)
  })

  it('test no async await', () => {
    let data
    renderHook(() => {
      useAsyncEffect(() => {
        data = 200
      })
    })
    expect(data).toEqual(200)
  })

  it('test no async await with cleanup', () => {
    let data
    let cleanup
    const hook = renderHook(() => {
      useAsyncEffect<void>(
        () => {
          data = 200
        },
        () => {
          cleanup = 100
        },
      )
    })
    expect(data).toEqual(200)
    act(() => {
      hook.rerender()
    })
    expect(cleanup).toBe(100)
  })
})
