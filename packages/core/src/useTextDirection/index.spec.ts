import { act, renderHook } from '@testing-library/react'
import { useTextDirection } from '.'

afterEach(() => {
  document.documentElement.removeAttribute('dir')
})

// The value the hook reports on each render, so the first one is visible and
// not just the settled one an effect has already corrected.
function renderSequence(hook: () => readonly [string, unknown]) {
  const seen: string[] = []
  const rendered = renderHook(() => {
    const result = hook()
    seen.push(result[0])
    return result
  })
  return { seen, rendered }
}

it('should report the document direction on the first render', () => {
  document.documentElement.setAttribute('dir', 'rtl')
  const { seen } = renderSequence(() => useTextDirection())
  expect(seen[0]).toBe('rtl')
})

it('should fall back to ltr when the document sets no direction', () => {
  const { rendered } = renderSequence(() => useTextDirection())
  expect(rendered.result.current[0]).toBe('ltr')
})

it('should prefer the document over an initialValue', () => {
  document.documentElement.setAttribute('dir', 'rtl')
  const { seen } = renderSequence(() => useTextDirection({ initialValue: 'ltr' }))
  expect(seen[0]).toBe('rtl')
})

it('should use initialValue when the document sets no direction', () => {
  const { rendered } = renderSequence(() => useTextDirection({ initialValue: 'rtl' }))
  expect(rendered.result.current[0]).toBe('rtl')
})

it('should write the direction to the selected element', () => {
  const { rendered } = renderSequence(() => useTextDirection())

  act(() => {
    (rendered.result.current[1] as (value: string) => void)('rtl')
  })
  expect(document.documentElement.getAttribute('dir')).toBe('rtl')
  expect(rendered.result.current[0]).toBe('rtl')
})
