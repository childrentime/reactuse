import { act, renderHook } from '@testing-library/react'
import { useInfiniteScroll } from '.'

describe('useInfiniteScroll', () => {
  let element: HTMLDivElement

  beforeEach(() => {
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    element.remove()
  })

  it('should be defined', () => {
    expect(useInfiniteScroll).toBeDefined()
  })

  it('does not load on mount', () => {
    let loads = 0
    renderHook(() => useInfiniteScroll(element, () => { loads++ }))

    expect(loads).toBe(0)
  })

  // The load-more effect lists the target in its dependencies. A `() => element`
  // getter is a new function on every render, so it used to fire onLoadMore on
  // every render — and appending the loaded data renders again, so it never stopped.
  it('does not load more on unrelated re-renders with a getter target', () => {
    let loads = 0
    const { rerender } = renderHook(() =>
      useInfiniteScroll(() => element, () => { loads++ }),
    )

    rerender()
    rerender()
    rerender()

    expect(loads).toBe(0)
  })

  it('does not load more on unrelated re-renders with a ref target', () => {
    let loads = 0
    const ref = { current: element as HTMLElement | null }
    const { rerender } = renderHook(() =>
      useInfiniteScroll(ref, () => { loads++ }),
    )

    rerender()
    rerender()

    expect(loads).toBe(0)
  })

  it('loads more when the target arrives at the bottom edge', () => {
    let loads = 0
    renderHook(() => useInfiniteScroll(element, () => { loads++ }))

    act(() => { element.dispatchEvent(new Event('scroll')) })

    expect(loads).toBe(1)
  })

  it('loads more when the target arrives at the bottom edge with a getter target', () => {
    let loads = 0
    renderHook(() => useInfiniteScroll(() => element, () => { loads++ }))

    act(() => { element.dispatchEvent(new Event('scroll')) })

    expect(loads).toBe(1)
  })

  it('does not load again on re-renders after it has loaded once', () => {
    let loads = 0
    const { rerender } = renderHook(() =>
      useInfiniteScroll(() => element, () => { loads++ }),
    )

    act(() => { element.dispatchEvent(new Event('scroll')) })
    expect(loads).toBe(1)

    rerender()
    rerender()

    expect(loads).toBe(1)
  })

  it('restores the scroll position when preserveScrollPosition is set', async () => {
    const scrollTo = jest.fn()
    element.scrollTo = scrollTo
    // arrived.bottom needs scrollTop + clientHeight >= scrollHeight - threshold
    Object.defineProperty(element, 'scrollHeight', { value: 500, configurable: true })
    Object.defineProperty(element, 'clientHeight', { value: 500, configurable: true })

    renderHook(() =>
      useInfiniteScroll(() => element, () => {}, { preserveScrollPosition: true }),
    )

    await act(async () => {
      element.dispatchEvent(new Event('scroll'))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0 })
  })

  it('awaits an async onLoadMore before restoring the scroll position', async () => {
    const order: string[] = []
    const scrollTo = jest.fn(() => order.push('scrollTo'))
    element.scrollTo = scrollTo as unknown as typeof element.scrollTo

    renderHook(() =>
      useInfiniteScroll(
        () => element,
        async () => {
          await Promise.resolve()
          order.push('loadMore')
        },
        { preserveScrollPosition: true },
      ),
    )

    await act(async () => {
      element.dispatchEvent(new Event('scroll'))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(order).toEqual(['loadMore', 'scrollTo'])
  })
})
