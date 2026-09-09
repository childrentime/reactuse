import { act, render, renderHook } from '@testing-library/react'
import { createElement, useRef } from 'react'
import { useMousePressed } from '.'
import type { UseMousePressedOptions } from './interface'

const DRAG_EVENTS = ['dragstart', 'drop', 'dragend']
const TOUCH_EVENTS = ['touchstart', 'touchend', 'touchcancel']

// Renders the hook against a ref the way a component does, so the element is
// assigned while committing, which is after render and before the effects. The
// spies go on that one element rather than on HTMLElement.prototype, which would
// also catch React's own delegated listeners on the container.
function renderWithRef(options?: UseMousePressedOptions) {
  let add: jest.SpyInstance | undefined
  let remove: jest.SpyInstance | undefined

  function Probe() {
    const ref = useRef<HTMLDivElement | null>(null)
    useMousePressed(ref, options)
    return createElement('div', {
      ref: (el: HTMLDivElement | null) => {
        ref.current = el
        if (el && !add) {
          add = jest.spyOn(el, 'addEventListener')
          remove = jest.spyOn(el, 'removeEventListener')
        }
      },
    })
  }

  const rendered = render(createElement(Probe))
  const calls = (spy?: jest.SpyInstance) => spy ? spy.mock.calls : []

  return {
    ...rendered,
    added: () => calls(add).map(([name]) => name as string),
    addCalls: () => calls(add),
    removeCalls: () => calls(remove),
    restore: () => {
      add?.mockRestore()
      remove?.mockRestore()
    },
  }
}

function setUpElement(options?: UseMousePressedOptions) {
  const target = document.createElement('div')
  const rendered = renderHook(() => useMousePressed(target, options))
  const fire = (type: string) => act(() => {
    target.dispatchEvent(new Event(type))
  })
  return { ...rendered, target, fire }
}

it('should start from the initial value', () => {
  const { result } = setUpElement()
  expect(result.current[0]).toBe(false)
  expect(result.current[1]).toBeNull()

  const withInitial = setUpElement({ initialValue: true })
  expect(withInitial.result.current[0]).toBe(true)
})

it('should report a mouse press and its release', () => {
  const { result, fire } = setUpElement()

  fire('mousedown')
  expect(result.current).toEqual([true, 'mouse'])

  act(() => {
    window.dispatchEvent(new Event('mouseup'))
  })
  expect(result.current).toEqual([false, null])
})

it('should report a touch press with its own source type', () => {
  const { result, fire } = setUpElement()

  fire('touchstart')
  expect(result.current).toEqual([true, 'touch'])

  fire('touchend')
  expect(result.current).toEqual([false, null])
})

// The target was resolved during render, where a ref handed to a child is still
// null, and the effect's dependency on the resolved element meant it never ran
// again. So only `mousedown`, which goes through `useEventListener` and resolves
// inside its own effect, was ever attached.
it('should attach the touch and drag listeners to a ref target', () => {
  const probe = renderWithRef()

  try {
    const added = probe.added()
    TOUCH_EVENTS.forEach(name => expect(added).toContain(name))
    DRAG_EVENTS.forEach(name => expect(added).toContain(name))
  }
  finally {
    probe.restore()
  }
})

it('should honour touch: false and drag: false for a ref target', () => {
  const probe = renderWithRef({ touch: false, drag: false })

  try {
    const added = probe.added()
    TOUCH_EVENTS.forEach(name => expect(added).not.toContain(name))
    DRAG_EVENTS.forEach(name => expect(added).not.toContain(name))
    expect(added).toContain('mousedown')
  }
  finally {
    probe.restore()
  }
})

// `onPressed` was curried, so `onPressed('mouse')` built a new function for the
// add and another for the remove. removeEventListener matches on the callback
// reference, so those two never came off.
it('should detach every listener it attached on unmount', () => {
  const probe = renderWithRef()

  try {
    const added = probe.addCalls().filter(([name]) =>
      TOUCH_EVENTS.includes(name as string) || DRAG_EVENTS.includes(name as string),
    )
    expect(added.length).toBe(TOUCH_EVENTS.length + DRAG_EVENTS.length)

    probe.unmount()

    const removed = probe.removeCalls()
    added.forEach(([name, fn]) => {
      expect(
        removed.some(([offName, offFn]) => offName === name && offFn === fn),
      ).toBe(true)
    })
  }
  finally {
    probe.restore()
  }
})
