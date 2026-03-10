import { act, renderHook } from '@testing-library/react'
import { useFocusWithin } from '.'

describe('useFocusWithin', () => {
  it('should track focus within element', () => {
    const container = document.createElement('div')
    const input = document.createElement('input')
    container.appendChild(input)
    document.body.appendChild(container)

    const { result } = renderHook(() => useFocusWithin(container))
    expect(result.current).toBe(false)

    act(() => {
      input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    })
    expect(result.current).toBe(true)

    act(() => {
      input.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }))
    })
    expect(result.current).toBe(false)

    document.body.removeChild(container)
  })
})
