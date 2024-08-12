import { act, renderHook } from '@testing-library/react'
import { useActiveElement } from '.'

describe('useActiveElement', () => {
  let input: HTMLInputElement;
  let body: HTMLElement;
  beforeEach(() => {
    input = document.createElement('input')
    document.body.appendChild(input)
    body = document.body
  })

  afterEach(() => {
    document.body.removeChild(input)
  })

  it('test focus/blur element', () => {
    const { result } = renderHook(() => useActiveElement())
    expect(result.current).toBe(body)

    act(() => {
      input.focus()
    })
    expect(result.current).toEqual(input)

    act(() => {
      input.blur()
    })
    expect(result.current).toEqual(document.body)
  })
})
