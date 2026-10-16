import { act, renderHook } from '@testing-library/react'
import { breakpointsTailwind, useBreakpoints } from '.'

let width = 0
let listeners: Array<() => void> = []

function setWidth(next: number) {
  width = next
  act(() => {
    listeners.slice().forEach(listener => listener())
  })
}

beforeEach(() => {
  width = 0
  listeners = []
  window.matchMedia = ((query: string) => {
    const min = Number(/min-width: ([\d.]+)px/.exec(query)![1])
    return {
      media: query,
      get matches() {
        return width >= min
      },
      addEventListener: (_: string, listener: () => void) => {
        listeners.push(listener)
      },
      removeEventListener: (_: string, listener: () => void) => {
        listeners = listeners.filter(l => l !== listener)
      },
    }
  }) as any
})

describe('useBreakpoints', () => {
  function setUp(initialWidth: number) {
    width = initialWidth
    return renderHook(() => useBreakpoints(breakpointsTailwind))
  }

  it('reports each breakpoint the viewport has reached', () => {
    const { result } = setUp(800)

    expect(result.current.sm).toBe(true)
    expect(result.current.md).toBe(true)
    expect(result.current.lg).toBe(false)
    expect(result.current.current).toEqual(['sm', 'md'])
    expect(result.current.active).toBe('md')
  })

  it('has no active breakpoint below the smallest one', () => {
    const { result } = setUp(320)

    expect(result.current.current).toEqual([])
    expect(result.current.active).toBeUndefined()
    expect(result.current.smaller('sm')).toBe(true)
  })

  it('treats a viewport exactly at a breakpoint as reaching it', () => {
    const { result } = setUp(768)

    expect(result.current.greaterOrEqual('md')).toBe(true)
    expect(result.current.greater('md')).toBe(false)
    expect(result.current.smaller('md')).toBe(false)
    expect(result.current.smallerOrEqual('md')).toBe(true)
  })

  it('checks a half-open range with between', () => {
    const { result } = setUp(1024)

    expect(result.current.between('md', 'xl')).toBe(true)
    expect(result.current.between('md', 'lg')).toBe(false)
    expect(result.current.between('sm', 'md')).toBe(false)
  })

  it('updates when the viewport crosses a breakpoint', () => {
    const { result } = setUp(800)

    setWidth(1300)
    expect(result.current.active).toBe('xl')
    expect(result.current.lg).toBe(true)

    setWidth(500)
    expect(result.current.active).toBeUndefined()
    expect(result.current.sm).toBe(false)
  })

  it('accepts breakpoints in any order', () => {
    width = 900
    const { result } = renderHook(() =>
      useBreakpoints({ desktop: 1280, mobile: 0, tablet: 768 }),
    )

    expect(result.current.current).toEqual(['mobile', 'tablet'])
    expect(result.current.active).toBe('tablet')
  })

  it('does not resubscribe when breakpoints are passed inline', () => {
    width = 900
    const { rerender } = renderHook(() => useBreakpoints({ tablet: 768, desktop: 1280 }))
    const count = listeners.length

    rerender()
    rerender()
    expect(listeners.length).toBe(count)
  })

  it('removes its listeners on unmount', () => {
    const { unmount } = setUp(800)

    expect(listeners.length).toBeGreaterThan(0)
    unmount()
    expect(listeners).toHaveLength(0)
  })

  it('falls back to defaultWidth without matchMedia', () => {
    ;(window as any).matchMedia = undefined
    const { result } = renderHook(() =>
      useBreakpoints(breakpointsTailwind, { defaultWidth: 1024 }),
    )

    expect(result.current.active).toBe('lg')
  })
})
