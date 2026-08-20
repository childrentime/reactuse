import { act, renderHook } from '@testing-library/react'
import { useCssVar } from '.'

describe('useCssVar', () => {
  let element: HTMLDivElement
  let RealMutationObserver: typeof MutationObserver
  let constructed: number

  beforeEach(() => {
    element = document.createElement('div')
    document.body.appendChild(element)
    constructed = 0
    RealMutationObserver = window.MutationObserver
    window.MutationObserver = class extends RealMutationObserver {
      constructor(callback: MutationCallback) {
        super(callback)
        constructed++
      }
    } as typeof MutationObserver
  })

  afterEach(() => {
    window.MutationObserver = RealMutationObserver
    element.remove()
  })

  it('should be defined', () => {
    expect(useCssVar).toBeDefined()
  })

  it('reads the variable off the target', () => {
    element.style.setProperty('--color', 'red')
    const { result } = renderHook(() => useCssVar('--color', element))

    expect(result.current[0]).toBe('red')
  })

  it('writes the variable through the returned setter', () => {
    const { result } = renderHook(() => useCssVar('--color', element))

    act(() => result.current[1]('blue'))
    expect(element.style.getPropertyValue('--color')).toBe('blue')
    expect(result.current[0]).toBe('blue')
  })

  // A `() => element` getter is a new function on every render, so depending on it
  // directly tore down and rebuilt the observer — and the returned setter — each time.
  it('keeps one observer across re-renders with a getter target', () => {
    const { rerender } = renderHook(() =>
      useCssVar('--color', () => element, 'red', { observe: true }),
    )

    const afterMount = constructed
    rerender()
    rerender()
    rerender()

    expect(afterMount).toBe(1)
    expect(constructed).toBe(1)
  })

  it('keeps the setter identity stable across re-renders with a getter target', () => {
    const { result, rerender } = renderHook(() => useCssVar('--color', () => element))

    const first = result.current[1]
    rerender()
    rerender()

    expect(result.current[1]).toBe(first)
  })

  it('applies the default value when the variable is unset', () => {
    const { result } = renderHook(() => useCssVar('--color', element, 'green'))

    expect(element.style.getPropertyValue('--color')).toBe('green')
    expect(result.current[0]).toBe('green')
  })

  it('does not override an existing value with the default', () => {
    element.style.setProperty('--color', 'red')
    const { result } = renderHook(() => useCssVar('--color', element, 'green'))

    expect(result.current[0]).toBe('red')
  })

  it('creates no observer unless observe is set', () => {
    renderHook(() => useCssVar('--color', element, 'red'))

    expect(constructed).toBe(0)
  })

  it('picks up style mutations when observe is set', async () => {
    const { result } = renderHook(() =>
      useCssVar('--color', element, 'red', { observe: true }),
    )

    expect(result.current[0]).toBe('red')

    await act(async () => {
      element.style.setProperty('--color', 'blue')
      await Promise.resolve()
    })

    expect(result.current[0]).toBe('blue')
  })

  it('does nothing when the target resolves to nothing', () => {
    const { result } = renderHook(() => useCssVar('--color', () => null, 'red'))

    expect(result.current[0]).toBe('red')
    expect(() => act(() => result.current[1]('blue'))).not.toThrow()
  })

  it('follows the target when it changes', () => {
    const other = document.createElement('div')
    other.style.setProperty('--color', 'blue')
    document.body.appendChild(other)
    element.style.setProperty('--color', 'red')

    const { result, rerender } = renderHook(
      ({ el }: { el: HTMLElement }) => useCssVar('--color', () => el),
      { initialProps: { el: element as HTMLElement } },
    )
    expect(result.current[0]).toBe('red')

    rerender({ el: other })
    expect(result.current[0]).toBe('blue')

    other.remove()
  })
})
