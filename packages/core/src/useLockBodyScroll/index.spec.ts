import { renderHook } from '@testing-library/react'
import { useLockBodyScroll } from '.'

describe('useLockBodyScroll', () => {
  it('should lock body scroll', () => {
    renderHook(() => useLockBodyScroll(true))
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('should not lock when false', () => {
    const original = document.body.style.overflow
    renderHook(() => useLockBodyScroll(false))
    expect(document.body.style.overflow).toBe(original)
  })

  it('should restore on unmount', () => {
    document.body.style.overflow = 'auto'
    const { unmount } = renderHook(() => useLockBodyScroll(true))
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('should default to locked', () => {
    renderHook(() => useLockBodyScroll())
    expect(document.body.style.overflow).toBe('hidden')
  })
})
