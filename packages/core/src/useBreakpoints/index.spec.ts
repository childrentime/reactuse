import { renderHook } from '@testing-library/react'
import { useBreakpoints, breakpointsTailwind } from '.'

describe('useBreakpoints', () => {
  it('should return breakpoint utilities', () => {
    const { result } = renderHook(() => useBreakpoints(breakpointsTailwind))
    expect(typeof result.current.greater).toBe('function')
    expect(typeof result.current.smaller).toBe('function')
    expect(typeof result.current.between).toBe('function')
    expect(typeof result.current.current).toBe('function')
    expect(Array.isArray(result.current.current())).toBe(true)
  })

  it('should work with custom breakpoints', () => {
    const { result } = renderHook(() =>
      useBreakpoints({ mobile: 320, tablet: 768, desktop: 1024 }),
    )
    expect(typeof result.current.greaterOrEqual).toBe('function')
    expect(typeof result.current.smallerOrEqual).toBe('function')
  })
})
