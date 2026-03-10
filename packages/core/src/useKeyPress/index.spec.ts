import { act, renderHook } from '@testing-library/react'
import { useKeyPress } from '.'

describe('useKeyPress', () => {
  it('should detect key press', () => {
    const { result } = renderHook(() => useKeyPress('Enter'))
    expect(result.current).toBe(false)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    })
    expect(result.current).toBe(true)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }))
    })
    expect(result.current).toBe(false)
  })

  it('should accept array of keys', () => {
    const { result } = renderHook(() => useKeyPress(['Enter', 'Space']))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Space' }))
    })
    expect(result.current).toBe(true)
  })

  it('should accept function filter', () => {
    const { result } = renderHook(() =>
      useKeyPress(e => e.key === 'a' && e.ctrlKey),
    )

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true }))
    })
    expect(result.current).toBe(true)
  })
})
