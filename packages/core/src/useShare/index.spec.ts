import { renderHook } from '@testing-library/react'
import { useShare } from '.'

describe('useShare', () => {
  it('should detect support', () => {
    const { result } = renderHook(() => useShare())
    expect(typeof result.current.isSupported).toBe('boolean')
    expect(typeof result.current.share).toBe('function')
  })
})
