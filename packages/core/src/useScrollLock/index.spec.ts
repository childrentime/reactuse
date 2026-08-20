import { act, renderHook } from '@testing-library/react'
import { useScrollLock } from '.'

let mockIsIOS = false

jest.mock('../utils/is', () => {
  const actual = jest.requireActual('../utils/is')
  return {
    ...actual,
    get isIOS() {
      return mockIsIOS
    },
  }
})

describe('useScrollLock', () => {
  let element: HTMLDivElement

  beforeEach(() => {
    mockIsIOS = false
    element = document.createElement('div')
    element.style.overflow = 'auto'
    document.body.appendChild(element)
  })

  afterEach(() => {
    element.remove()
    jest.restoreAllMocks()
  })

  it('locks the target and restores the original inline overflow', () => {
    const { result } = renderHook(() => useScrollLock(element))

    expect(result.current[0]).toBe(false)
    expect(element.style.overflow).toBe('auto')

    act(() => result.current[1](true))
    expect(result.current[0]).toBe(true)
    expect(element.style.overflow).toBe('hidden')

    act(() => result.current[1](false))
    expect(result.current[0]).toBe(false)
    expect(element.style.overflow).toBe('auto')
  })

  it('releases the lock when the component unmounts while locked', () => {
    const { result, unmount } = renderHook(() => useScrollLock(element))

    act(() => result.current[1](true))
    expect(element.style.overflow).toBe('hidden')

    unmount()
    expect(element.style.overflow).toBe('auto')
  })

  it('leaves the element alone when it unmounts unlocked', () => {
    const { result, unmount } = renderHook(() => useScrollLock(element))

    act(() => result.current[1](true))
    act(() => result.current[1](false))
    element.style.overflow = 'scroll'

    unmount()
    expect(element.style.overflow).toBe('scroll')
  })

  it('removes the iOS touchmove guard when it unmounts while locked', () => {
    mockIsIOS = true
    const add = jest.spyOn(element, 'addEventListener')
    const remove = jest.spyOn(element, 'removeEventListener')

    const { result, unmount } = renderHook(() => useScrollLock(element))

    act(() => result.current[1](true))
    expect(add).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false })

    unmount()
    expect(remove).toHaveBeenCalledWith('touchmove', add.mock.calls[0][1])
    expect(element.style.overflow).toBe('auto')
  })

  it('honours initialState and releases it on unmount', () => {
    const { result, unmount } = renderHook(() => useScrollLock(element, true))

    expect(result.current[0]).toBe(true)
    expect(element.style.overflow).toBe('hidden')

    unmount()
    expect(element.style.overflow).toBe('auto')
  })

  it('accepts a getter target and does nothing without an element', () => {
    const { result: getter } = renderHook(() => useScrollLock(() => element))
    act(() => getter.current[1](true))
    expect(element.style.overflow).toBe('hidden')

    const { result: empty, unmount } = renderHook(() => useScrollLock(() => null))
    act(() => empty.current[1](true))
    expect(empty.current[0]).toBe(false)
    expect(() => unmount()).not.toThrow()
  })

  // The effect that applies the lock lists `target` in its dependencies, so an
  // inline getter — the form the docs recommend for SSR — invalidates it on every
  // render. Re-running it must not re-snapshot the overflow it already replaced.
  it('keeps the original overflow across re-renders while locked', () => {
    const { result, rerender } = renderHook(() => useScrollLock(() => element))

    act(() => result.current[1](true))
    expect(element.style.overflow).toBe('hidden')

    rerender()
    rerender()

    act(() => result.current[1](false))
    expect(element.style.overflow).toBe('auto')
  })

  it('restores a non-default inline overflow after a re-render while locked', () => {
    element.style.overflow = 'overlay'
    const { result, rerender } = renderHook(() => useScrollLock(() => element))

    act(() => result.current[1](true))
    rerender()
    act(() => result.current[1](false))

    expect(element.style.overflow).toBe('overlay')
  })

  it('releases the lock on unmount after a re-render while locked', () => {
    const { result, rerender, unmount } = renderHook(() => useScrollLock(() => element))

    act(() => result.current[1](true))
    rerender()
    unmount()

    expect(element.style.overflow).toBe('auto')
  })

  it('honours initialState across re-renders', () => {
    const { result, rerender } = renderHook(() => useScrollLock(() => element, true))

    rerender()
    act(() => result.current[1](false))

    expect(element.style.overflow).toBe('auto')
  })

  it('re-snapshots the overflow on every fresh lock', () => {
    const { result, rerender } = renderHook(() => useScrollLock(() => element))

    act(() => result.current[1](true))
    rerender()
    act(() => result.current[1](false))
    expect(element.style.overflow).toBe('auto')

    element.style.overflow = 'scroll'
    act(() => result.current[1](true))
    rerender()
    act(() => result.current[1](false))
    expect(element.style.overflow).toBe('scroll')
  })

  it('restores the previous element when the target changes while locked', () => {
    const other = document.createElement('div')
    other.style.overflow = 'overlay'
    document.body.appendChild(other)

    const { result, rerender } = renderHook(
      ({ el }: { el: HTMLElement }) => useScrollLock(() => el),
      { initialProps: { el: element as HTMLElement } },
    )

    act(() => result.current[1](true))
    expect(element.style.overflow).toBe('hidden')

    rerender({ el: other })
    expect(element.style.overflow).toBe('auto')
    expect(other.style.overflow).toBe('hidden')

    act(() => result.current[1](false))
    expect(other.style.overflow).toBe('overlay')
    other.remove()
  })
})
