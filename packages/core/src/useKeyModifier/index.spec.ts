import { act, renderHook } from '@testing-library/react'
import { useKeyModifier } from '.'
import type { KeyModifier } from './interface'

function press(event: string, held: KeyModifier[]) {
  const evt = new Event(event) as any
  evt.getModifierState = (key: string) => held.includes(key as KeyModifier)
  act(() => {
    document.dispatchEvent(evt)
  })
}

it('should start from the initial value', () => {
  const { result } = renderHook(() => useKeyModifier('Shift'))
  expect(result.current).toBe(false)

  const withInitial = renderHook(() => useKeyModifier('Shift', { initial: true }))
  expect(withInitial.result.current).toBe(true)
})

it('should follow the modifier as it is held and released', () => {
  const { result } = renderHook(() => useKeyModifier('Shift'))

  press('keydown', ['Shift'])
  expect(result.current).toBe(true)

  press('keyup', [])
  expect(result.current).toBe(false)
})

it('should only listen to the events it was given', () => {
  const { result } = renderHook(() => useKeyModifier('Shift', { events: ['keydown'] }))

  press('mousedown', ['Shift'])
  expect(result.current).toBe(false)

  press('keydown', ['Shift'])
  expect(result.current).toBe(true)
})

// The listeners were registered through `useMount`, which discards the callback's
// return value, and the cleanup passed a newly built arrow function to
// `removeEventListener`, which matches by reference. So neither route detached
// anything and every mount left four more listeners on `document`.
it('should detach its listeners on unmount', () => {
  const add = jest.spyOn(document, 'addEventListener')
  const remove = jest.spyOn(document, 'removeEventListener')

  try {
    const { unmount } = renderHook(() => useKeyModifier('Shift'))
    const added = add.mock.calls.filter(([, fn]) => typeof fn === 'function')
    expect(added).toHaveLength(4)

    unmount()

    // Same event names and the same function references, or the listener stays.
    const removed = remove.mock.calls.filter(([, fn]) => typeof fn === 'function')
    expect(removed.map(([name]) => name).sort()).toEqual(
      added.map(([name]) => name).sort(),
    )
    added.forEach(([, fn]) => {
      expect(removed.some(([, off]) => off === fn)).toBe(true)
    })
  }
  finally {
    add.mockRestore()
    remove.mockRestore()
  }
})

// A stale listener is not just a leak: it still calls `setState` on an unmounted
// component every time the key is pressed.
it('should stop reporting after unmount', () => {
  const { result, unmount } = renderHook(() => useKeyModifier('Shift'))

  press('keydown', ['Shift'])
  expect(result.current).toBe(true)

  unmount()
  const seen: string[] = []
  const evt = new Event('keydown') as any
  evt.getModifierState = (key: string) => {
    seen.push(key)
    return true
  }
  act(() => {
    document.dispatchEvent(evt)
  })

  expect(seen).toEqual([])
})

// The handler closed over the mount-time `modifier`, and `useMount`'s empty
// dependency list never re-registered it, so the argument was frozen for the
// lifetime of the component.
it('should follow a changed modifier', () => {
  const { result, rerender } = renderHook(
    (modifier: KeyModifier) => useKeyModifier(modifier),
    { initialProps: 'Shift' as KeyModifier },
  )

  press('keydown', ['Control'])
  expect(result.current).toBe(false)

  rerender('Control')
  press('keydown', ['Control'])
  expect(result.current).toBe(true)
})

it('should not re-register when an inline events array is passed again', () => {
  const add = jest.spyOn(document, 'addEventListener')

  try {
    const { rerender } = renderHook(() => useKeyModifier('Shift', { events: ['keydown'] }))
    const first = add.mock.calls.length

    rerender()
    expect(add.mock.calls.length).toBe(first)
  }
  finally {
    add.mockRestore()
  }
})
