import { renderHook } from '@testing-library/react'
import { createMockMediaMatcher } from '../../.test'
import { usePreferredDark } from '.'

describe(usePreferredDark, () => {
  it('should return true if media query matches', () => {
    window.matchMedia = createMockMediaMatcher({
      '(prefers-color-scheme: dark)': true,
    }) as any
    const { result } = renderHook(() => usePreferredDark())
    expect(result.current).toBe(true)
  })

  it('should return false if media query dont\'t matches', () => {
    window.matchMedia = createMockMediaMatcher({
      '(prefers-color-scheme: dark)': false,
    }) as any
    const { result } = renderHook(() => usePreferredDark())
    expect(result.current).toBe(false)
  })
})
