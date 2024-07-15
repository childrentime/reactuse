import { renderHook } from '@testing-library/react'
import { createMockMediaMatcher } from '../../.test'
import { useMediaQuery as useMedia } from '.'

describe('useMedia', () => {
  beforeEach(() => {
    window.matchMedia = createMockMediaMatcher({
      '(min-width: 500px)': true,
      '(min-width: 1000px)': false,
    }) as any
  })

  it('should return true if media query matches', () => {
    const { result } = renderHook(() => useMedia('(min-width: 500px)'))
    expect(result.current).toBe(true)
  })
  it('should return false if media query does not match', () => {
    const { result } = renderHook(() => useMedia('(min-width: 1200px)'))
    expect(result.current).toBe(false)
  })
})
