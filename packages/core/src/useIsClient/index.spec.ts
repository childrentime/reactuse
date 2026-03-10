import { renderHook } from '@testing-library/react'
import { useIsClient } from '.'

describe('useIsClient', () => {
  it('should return true on client', () => {
    const { result } = renderHook(() => useIsClient())
    expect(result.current).toBe(true)
  })
})
