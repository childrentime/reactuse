import { renderHook } from '@testing-library/react'
import { useImage } from '.'

describe('useImage', () => {
  it('should start loading', () => {
    const { result } = renderHook(() => useImage({ src: 'test.png' }))
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeUndefined()
  })
})
